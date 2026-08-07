from __future__ import annotations

import io
import logging

from gtts import gTTS
from pydantic import validate_call

from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.enums import LanguageStyle
from app.domain.exceptions import ValidationException

logger = logging.getLogger(__name__)

LANGUAGE_STYLE_TO_GTTS: dict[LanguageStyle, tuple[str, str]] = {
    LanguageStyle.SIMPLE_ENGLISH: ("en", "co.in"),
    LanguageStyle.FORMAL_ENGLISH: ("en", "co.in"),
    LanguageStyle.HINGLISH: ("en", "co.in"),
    LanguageStyle.HINDI: ("hi", "co.in"),
    LanguageStyle.BILINGUAL: ("en", "co.in"),
}


class TtsService:
    @validate_call(validate_return=True)
    def synthesize_speech(
        self,
        text: str,
        language_style: LanguageStyle | None = None,
    ) -> bytes:
        trimmed_text = text.strip()
        if trimmed_text == "":
            raise ValidationException("text cannot be empty")
        if len(trimmed_text) > 5000:
            raise ValidationException("text exceeds maximum length of 5000 characters")

        resolved_style = language_style if language_style is not None else LanguageStyle.SIMPLE_ENGLISH
        language_code, top_level_domain = LANGUAGE_STYLE_TO_GTTS[resolved_style]

        operation = "synthesize_speech"
        log_external_api_request(logger, "gTTS", operation, trimmed_text)
        try:
            audio_buffer = io.BytesIO()
            gTTS(text=trimmed_text, lang=language_code, tld=top_level_domain).write_to_fp(audio_buffer)
            audio_bytes = audio_buffer.getvalue()
        except Exception as error:
            log_external_api_error(logger, "gTTS", operation, error, request_payload=trimmed_text)
            raise ValidationException(f"TTS synthesis failed: {error}") from error

        log_external_api_response(logger, "gTTS", operation, f"[audio bytes={len(audio_bytes)}]")
        return audio_bytes
