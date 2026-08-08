"""Text-to-Speech service.

Uses ElevenLabs when ELEVENLABS_API_KEY is set, otherwise falls back to gTTS.
"""

from __future__ import annotations

import io
import logging
import os

import httpx
from gtts import gTTS
from pydantic import validate_call

from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.exceptions import ValidationException

logger = logging.getLogger(__name__)

ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"


class TtsService:
    @validate_call(validate_return=True)
    def synthesize_speech(
        self,
        text: str,
        persona: str | None = None,
        language_style: str | None = None,
    ) -> bytes:
        trimmed = text.strip()
        if trimmed == "":
            raise ValidationException("text cannot be empty")
        if len(trimmed) > 5000:
            raise ValidationException("text exceeds maximum length of 5000 characters")

        api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
        if api_key != "":
            return self._synthesize_elevenlabs(trimmed, api_key)

        return self._synthesize_gtts(trimmed)

    def _synthesize_elevenlabs(self, text: str, api_key: str) -> bytes:
        voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "RDWdsTU6N02BFftbIEAp")
        url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}"

        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.4,
                "use_speaker_boost": True,
            },
        }

        operation = f"synthesize voice={voice_id}"
        log_external_api_request(logger, "ElevenLabs", operation, text[:100])

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    url,
                    json=payload,
                    headers={
                        "xi-api-key": api_key,
                        "Content-Type": "application/json",
                        "Accept": "audio/mpeg",
                    },
                )
                response.raise_for_status()
                audio_bytes = response.content
        except httpx.HTTPStatusError as error:
            detail = error.response.text[:200] if error.response is not None else ""
            log_external_api_error(logger, "ElevenLabs", operation, error)
            logger.warning("ElevenLabs failed (%s), falling back to gTTS", detail)
            return self._synthesize_gtts(text)
        except Exception as error:
            log_external_api_error(logger, "ElevenLabs", operation, error)
            logger.warning("ElevenLabs failed, falling back to gTTS: %s", error)
            return self._synthesize_gtts(text)

        if len(audio_bytes) == 0:
            logger.warning("ElevenLabs returned empty audio, falling back to gTTS")
            return self._synthesize_gtts(text)

        log_external_api_response(logger, "ElevenLabs", operation, f"[audio bytes={len(audio_bytes)}]")
        return audio_bytes

    def _synthesize_gtts(self, text: str) -> bytes:
        operation = "synthesize_speech"
        log_external_api_request(logger, "gTTS", operation, text[:100])
        try:
            audio_buffer = io.BytesIO()
            gTTS(text=text, lang="en", tld="co.in").write_to_fp(audio_buffer)
            audio_bytes = audio_buffer.getvalue()
        except Exception as error:
            log_external_api_error(logger, "gTTS", operation, error, request_payload=text[:100])
            raise ValidationException(f"TTS synthesis failed: {error}") from error

        log_external_api_response(logger, "gTTS", operation, f"[audio bytes={len(audio_bytes)}]")
        return audio_bytes
