"""ElevenLabs Text-to-Speech client.

Calls the ElevenLabs v1 TTS API and streams the audio response back as bytes.
The API key is read from settings and never exposed to the frontend.
"""

from __future__ import annotations

import logging

import httpx
from pydantic import validate_call

from app.config import settings
from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.exceptions import ValidationException
from app.infrastructure.elevenlabs.voice_config import resolve_voice_id

logger = logging.getLogger(__name__)

ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"
DEFAULT_MODEL_ID = "eleven_multilingual_v2"


class ElevenLabsClient:
    """Synthesizes speech via the ElevenLabs REST API."""

    @validate_call(validate_return=True)
    def synthesize(
        self,
        text: str,
        persona: str | None = None,
        model_id: str | None = None,
    ) -> bytes:
        if settings.ELEVENLABS_API_KEY.strip() == "":
            raise ValidationException(
                "ElevenLabs API key is not configured. Set ELEVENLABS_API_KEY in .env"
            )

        voice_id = resolve_voice_id(persona)
        resolved_model = model_id or DEFAULT_MODEL_ID
        url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}"

        payload = {
            "text": text,
            "model_id": resolved_model,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.4,
                "use_speaker_boost": True,
            },
        }

        operation = f"synthesize persona={persona or 'default'} voice={voice_id}"
        log_external_api_request(logger, "ElevenLabs", operation, text[:100])

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    url,
                    json=payload,
                    headers={
                        "xi-api-key": settings.ELEVENLABS_API_KEY,
                        "Content-Type": "application/json",
                        "Accept": "audio/mpeg",
                    },
                )
                response.raise_for_status()
                audio_bytes = response.content
        except httpx.HTTPStatusError as error:
            log_external_api_error(logger, "ElevenLabs", operation, error)
            detail = error.response.text[:200] if error.response is not None else ""
            raise ValidationException(
                f"ElevenLabs TTS failed (HTTP {error.response.status_code}): {detail}"
            ) from error
        except Exception as error:
            log_external_api_error(logger, "ElevenLabs", operation, error)
            raise ValidationException(f"ElevenLabs TTS failed: {error}") from error

        if len(audio_bytes) == 0:
            raise ValidationException("ElevenLabs returned empty audio")

        log_external_api_response(
            logger, "ElevenLabs", operation, f"[audio bytes={len(audio_bytes)}]"
        )
        return audio_bytes
