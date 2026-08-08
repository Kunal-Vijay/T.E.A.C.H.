"""Text-to-Speech service.

Uses gTTS (Google Translate TTS) — free, no API key, no credentials needed.
"""

from __future__ import annotations

import io
import logging

from gtts import gTTS
from pydantic import validate_call

from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.exceptions import ValidationException

logger = logging.getLogger(__name__)


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

        operation = "synthesize_speech"
        log_external_api_request(logger, "gTTS", operation, trimmed[:100])
        try:
            audio_buffer = io.BytesIO()
            gTTS(text=trimmed, lang="en", tld="co.in").write_to_fp(audio_buffer)
            audio_bytes = audio_buffer.getvalue()
        except Exception as error:
            log_external_api_error(logger, "gTTS", operation, error, request_payload=trimmed[:100])
            raise ValidationException(f"TTS synthesis failed: {error}") from error

        log_external_api_response(logger, "gTTS", operation, f"[audio bytes={len(audio_bytes)}]")
        return audio_bytes
