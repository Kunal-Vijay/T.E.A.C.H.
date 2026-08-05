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
    def synthesize_speech(self, text: str) -> bytes:
        trimmed_text = text.strip()
        if trimmed_text == "":
            raise ValidationException("text cannot be empty")
        if len(trimmed_text) > 5000:
            raise ValidationException("text exceeds maximum length of 5000 characters")

        operation = "synthesize_speech"
        log_external_api_request(logger, "gTTS", operation, trimmed_text)
        try:
            audio_buffer = io.BytesIO()
            gTTS(text=trimmed_text, lang="en", tld="co.in").write_to_fp(audio_buffer)
            audio_bytes = audio_buffer.getvalue()
        except Exception as error:
            log_external_api_error(logger, "gTTS", operation, error, request_payload=trimmed_text)
            raise ValidationException(f"TTS synthesis failed: {error}") from error

        log_external_api_response(logger, "gTTS", operation, f"[audio bytes={len(audio_bytes)}]")
        return audio_bytes
