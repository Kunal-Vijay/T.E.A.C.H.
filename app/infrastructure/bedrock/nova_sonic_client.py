"""Amazon Nova Sonic bidirectional streaming client.

Nova Sonic is a speech-to-speech model driven over the Bedrock
InvokeModelWithBidirectionalStream API. Unlike a normal request/response model it
keeps one long-lived HTTP/2 stream open and both sides push JSON events onto it.

Event order on session start is mandatory:
    sessionStart -> promptStart -> contentStart(SYSTEM,TEXT) -> textInput
    -> contentEnd -> contentStart(USER,AUDIO) -> audioInput* -> contentEnd
    -> promptEnd -> sessionEnd

Audio contract: input is 16 kHz mono PCM16, output is 24 kHz mono PCM16, both
base64 encoded on the wire.

Requires Python 3.12+ (the aws-sdk-bedrock-runtime experimental SDK floor), which
is why the backend runs on ./venv312.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import uuid
from collections.abc import AsyncIterator
from typing import Any

from app.config import settings
from app.domain.exceptions import ValidationException

logger = logging.getLogger(__name__)

INPUT_SAMPLE_RATE = 16000
OUTPUT_SAMPLE_RATE = 24000
CHANNELS = 1
SAMPLE_SIZE_BITS = 16

# Nova 2 Sonic drops the connection at 8 minutes. Surface it as a normal close
# rather than an error so the UI can offer a reconnect.
MAX_SESSION_SECONDS = 8 * 60


class NovaSonicSession:
    """One voice conversation with Nova Sonic.

    Usage:
        session = NovaSonicSession(system_prompt="...")
        await session.start()
        await session.send_audio_chunk(pcm16_bytes)     # from the mic
        async for event in session.events():            # model output
            ...
        await session.close()
    """

    def __init__(
        self,
        system_prompt: str,
        voice_id: str | None = None,
        model_id: str | None = None,
        region: str | None = None,
    ) -> None:
        if system_prompt.strip() == "":
            raise ValidationException("system_prompt cannot be empty")

        self.system_prompt = system_prompt
        self.voice_id = voice_id or settings.NOVA_SONIC_VOICE_ID
        self.model_id = model_id or settings.NOVA_SONIC_MODEL_ID
        self.region = region or settings.AWS_REGION

        self.prompt_name = str(uuid.uuid4())
        self.system_content_name = str(uuid.uuid4())
        self.audio_content_name = str(uuid.uuid4())

        self._client: Any = None
        self._stream: Any = None
        self._is_active = False
        self._audio_input_open = False
        self._send_lock = asyncio.Lock()
        # Only used by scripts/check_nova_kickoff.py. Measured either way: whether the
        # kickoff goes out before or after the audio block makes no difference.
        self.kickoff_before_audio = True

    @property
    def is_active(self) -> bool:
        return self._is_active

    def _build_client(self) -> Any:
        # Imported lazily so the rest of the app still boots when the experimental
        # SDK is absent (e.g. running on the 3.11 venv).
        try:
            from aws_sdk_bedrock_runtime.client import AsyncBedrockRuntimeClient
            from aws_sdk_bedrock_runtime.config import Config, HTTPAuthSchemeResolver, SigV4AuthScheme
            from smithy_aws_core.identity import AWSCredentialsIdentity, StaticCredentialsResolver
        except ImportError as error:
            raise ValidationException(
                "aws-sdk-bedrock-runtime is not installed. Nova Sonic needs Python 3.12+ — "
                f"run the backend from ./venv312. ({error})"
            ) from error

        if not settings.nova_sonic_is_configured:
            raise ValidationException(
                "AWS credentials are not configured. Set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in .env"
            )

        identity = AWSCredentialsIdentity(
            access_key_id=settings.AWS_ACCESS_KEY_ID,
            secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            session_token=settings.AWS_SESSION_TOKEN or None,
        )
        config = Config(
            endpoint_uri=f"https://bedrock-runtime.{self.region}.amazonaws.com",
            region=self.region,
            aws_credentials_identity_resolver=StaticCredentialsResolver(identity),
            auth_scheme_resolver=HTTPAuthSchemeResolver(),
            auth_schemes={"aws.auth#sigv4": SigV4AuthScheme(service="bedrock")},
        )
        return AsyncBedrockRuntimeClient(config=config)

    async def _send_event(self, payload: dict[str, Any]) -> None:
        from aws_sdk_bedrock_runtime.models import (
            BidirectionalInputPayloadPart,
            InvokeModelWithBidirectionalStreamInputChunk,
        )

        # json.dumps rather than f-string interpolation: the system prompt contains
        # newlines and quotes that would otherwise produce invalid JSON.
        encoded = json.dumps(payload).encode("utf-8")
        chunk = InvokeModelWithBidirectionalStreamInputChunk(
            value=BidirectionalInputPayloadPart(bytes_=encoded)
        )
        async with self._send_lock:
            await self._stream.input_stream.send(chunk)

    async def start(self, kickoff: str | None = None) -> None:
        from aws_sdk_bedrock_runtime.models import InvokeModelWithBidirectionalStreamOperationInput

        self._client = self._build_client()
        logger.info(
            "Opening Nova Sonic stream model=%s region=%s voice=%s prompt_chars=%s",
            self.model_id,
            self.region,
            self.voice_id,
            len(self.system_prompt),
        )
        self._stream = await self._client.invoke_model_with_bidirectional_stream(
            InvokeModelWithBidirectionalStreamOperationInput(model_id=self.model_id)
        )
        self._is_active = True

        sensitivity = settings.NOVA_SONIC_ENDPOINTING_SENSITIVITY.strip().upper()
        if sensitivity not in {"HIGH", "MEDIUM", "LOW"}:
            logger.warning(
                "Unknown NOVA_SONIC_ENDPOINTING_SENSITIVITY=%r, falling back to MEDIUM",
                settings.NOVA_SONIC_ENDPOINTING_SENSITIVITY,
            )
            sensitivity = "MEDIUM"

        await self._send_event(
            {
                "event": {
                    "sessionStart": {
                        "inferenceConfiguration": {
                            "maxTokens": settings.NOVA_SONIC_MAX_TOKENS,
                            "topP": settings.NOVA_SONIC_TOP_P,
                            "temperature": settings.NOVA_SONIC_TEMPERATURE,
                        },
                        # Controls how quickly the model decides the student has
                        # stopped talking. Without this the service default applies
                        # and tends to cut in while the student is still thinking.
                        "turnDetectionConfiguration": {
                            "endpointingSensitivity": sensitivity,
                        },
                    }
                }
            }
        )
        await self._send_event(
            {
                "event": {
                    "promptStart": {
                        "promptName": self.prompt_name,
                        "textOutputConfiguration": {"mediaType": "text/plain"},
                        "audioOutputConfiguration": {
                            "mediaType": "audio/lpcm",
                            "sampleRateHertz": OUTPUT_SAMPLE_RATE,
                            "sampleSizeBits": SAMPLE_SIZE_BITS,
                            "channelCount": CHANNELS,
                            "voiceId": self.voice_id,
                            "encoding": "base64",
                            "audioType": "SPEECH",
                        },
                    }
                }
            }
        )
        await self._send_system_prompt()

        # IMPORTANT: the kickoff alone is not enough. Nova Sonic's turn machinery is
        # driven by the audio stream, so it will not speak into a dead channel no
        # matter what text you inject — the caller must start sending audio frames
        # (silence is fine) for the opening turn to fire. With frames flowing it
        # speaks in ~2.5s. Measured both orderings and neither matters; see
        # scripts/check_nova_kickoff.py.
        if kickoff is not None and self.kickoff_before_audio:
            await self.send_kickoff(kickoff)
            await self._open_audio_input()
        else:
            await self._open_audio_input()
            if kickoff is not None:
                await self.send_kickoff(kickoff)

        logger.info("Nova Sonic stream ready prompt_name=%s", self.prompt_name)

    async def send_kickoff(self, instruction: str) -> None:
        """Give the tutor something to respond to, so it opens the conversation.

        Nova Sonic says nothing until it has user input, which leaves the student
        staring at silence. Nova 2 Sonic supports cross-modal input — a TEXT content
        block with role USER and interactive=true — so a hidden instruction is
        injected as if the student had typed it.

        This only primes the response. The turn still does not fire until audio
        frames start arriving; see the note in start().

        The instruction never reaches the transcript, because the browser only
        renders what comes back as textOutput.
        """
        if not self._is_active:
            return
        kickoff_content_name = str(uuid.uuid4())
        await self._send_event(
            {
                "event": {
                    "contentStart": {
                        "promptName": self.prompt_name,
                        "contentName": kickoff_content_name,
                        "type": "TEXT",
                        "interactive": True,
                        "role": "USER",
                        "textInputConfiguration": {"mediaType": "text/plain"},
                    }
                }
            }
        )
        await self._send_event(
            {
                "event": {
                    "textInput": {
                        "promptName": self.prompt_name,
                        "contentName": kickoff_content_name,
                        "content": instruction,
                    }
                }
            }
        )
        await self._send_event(
            {
                "event": {
                    "contentEnd": {
                        "promptName": self.prompt_name,
                        "contentName": kickoff_content_name,
                    }
                }
            }
        )
        logger.info("Sent kickoff to open the conversation prompt_name=%s", self.prompt_name)

    async def _send_system_prompt(self) -> None:
        await self._send_event(
            {
                "event": {
                    "contentStart": {
                        "promptName": self.prompt_name,
                        "contentName": self.system_content_name,
                        "type": "TEXT",
                        "interactive": True,
                        "role": "SYSTEM",
                        "textInputConfiguration": {"mediaType": "text/plain"},
                    }
                }
            }
        )
        await self._send_event(
            {
                "event": {
                    "textInput": {
                        "promptName": self.prompt_name,
                        "contentName": self.system_content_name,
                        "content": self.system_prompt,
                    }
                }
            }
        )
        await self._send_event(
            {
                "event": {
                    "contentEnd": {
                        "promptName": self.prompt_name,
                        "contentName": self.system_content_name,
                    }
                }
            }
        )

    async def _open_audio_input(self) -> None:
        await self._send_event(
            {
                "event": {
                    "contentStart": {
                        "promptName": self.prompt_name,
                        "contentName": self.audio_content_name,
                        "type": "AUDIO",
                        "interactive": True,
                        "role": "USER",
                        "audioInputConfiguration": {
                            "mediaType": "audio/lpcm",
                            "sampleRateHertz": INPUT_SAMPLE_RATE,
                            "sampleSizeBits": SAMPLE_SIZE_BITS,
                            "channelCount": CHANNELS,
                            "audioType": "SPEECH",
                            "encoding": "base64",
                        },
                    }
                }
            }
        )
        self._audio_input_open = True

    async def send_audio_chunk(self, audio_bytes: bytes) -> None:
        """Push one chunk of 16 kHz mono PCM16 microphone audio."""
        if not self._is_active or not self._audio_input_open:
            return
        await self._send_event(
            {
                "event": {
                    "audioInput": {
                        "promptName": self.prompt_name,
                        "contentName": self.audio_content_name,
                        "content": base64.b64encode(audio_bytes).decode("utf-8"),
                    }
                }
            }
        )

    async def events(self) -> AsyncIterator[dict[str, Any]]:
        """Yield decoded model output events until the stream ends."""
        while self._is_active:
            try:
                output = await self._stream.await_output()
                result = await output[1].receive()
            except asyncio.CancelledError:
                raise
            except Exception as error:  # noqa: BLE001 - stream teardown surfaces as many types
                logger.info("Nova Sonic stream closed: %s: %s", type(error).__name__, error)
                self._is_active = False
                return

            if result is None or result.value is None or result.value.bytes_ is None:
                continue
            try:
                payload = json.loads(result.value.bytes_.decode("utf-8"))
            except json.JSONDecodeError:
                logger.warning("Discarding non-JSON frame from Nova Sonic")
                continue
            yield payload

    async def close(self) -> None:
        if not self._is_active:
            return
        self._is_active = False
        try:
            if self._audio_input_open:
                await self._send_event(
                    {
                        "event": {
                            "contentEnd": {
                                "promptName": self.prompt_name,
                                "contentName": self.audio_content_name,
                            }
                        }
                    }
                )
                self._audio_input_open = False
            await self._send_event({"event": {"promptEnd": {"promptName": self.prompt_name}}})
            await self._send_event({"event": {"sessionEnd": {}}})
            await self._stream.input_stream.close()
        except Exception as error:  # noqa: BLE001 - best-effort teardown
            logger.info("Nova Sonic teardown raised (ignored): %s: %s", type(error).__name__, error)
        logger.info("Nova Sonic session closed prompt_name=%s", self.prompt_name)


def classify_event(payload: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    """Return the (event_name, event_body) of a Nova Sonic output event."""
    event = payload.get("event", {})
    if not isinstance(event, dict) or not event:
        return "unknown", {}
    name = next(iter(event))
    body = event[name]
    return name, body if isinstance(body, dict) else {}


def is_interruption_text(content: str) -> bool:
    """True when a textOutput payload is the barge-in signal rather than speech.

    Nova Sonic reports interruptions in-band, as a textOutput whose content is the
    JSON document {"interrupted": true}. It is a control message, not something the
    tutor said, so it must never reach the transcript. Spacing varies between
    versions, hence parsing rather than string matching.
    """
    stripped = content.strip()
    if not stripped.startswith("{"):
        return False
    try:
        parsed = json.loads(stripped)
    except json.JSONDecodeError:
        return False
    return isinstance(parsed, dict) and parsed.get("interrupted") is True
