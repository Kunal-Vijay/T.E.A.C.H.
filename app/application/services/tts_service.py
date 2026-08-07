from __future__ import annotations

import io
import logging

from gtts import gTTS
from pydantic import validate_call

from app.config import settings
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
        persona: str | None = None,
    ) -> bytes:
        trimmed_text = text.strip()
        if trimmed_text == "":
            raise ValidationException("text cannot be empty")
        if len(trimmed_text) > 5000:
            raise ValidationException("text exceeds maximum length of 5000 characters")

        # Route to ElevenLabs when configured and requested.
        if self._should_use_elevenlabs(persona):
            return self._synthesize_elevenlabs(trimmed_text, persona)

        # Fallback: gTTS (free, no API key needed)
        return self._synthesize_gtts(trimmed_text, language_style)

    def _should_use_elevenlabs(self, persona: str | None) -> bool:
        """Determine if ElevenLabs should be used for this request."""
        provider = settings.TTS_PROVIDER.strip().lower()
        has_key = settings.ELEVENLABS_API_KEY.strip() != ""

        if provider == "elevenlabs":
            return True
        if provider == "gtts":
            return False
        # auto: use ElevenLabs when the key is set
        return has_key

    def _synthesize_elevenlabs(self, text: str, persona: str | None) -> bytes:
        from app.infrastructure.elevenlabs.elevenlabs_client import ElevenLabsClient

        client = ElevenLabsClient()
        try:
            return client.synthesize(text, persona)
        except ValidationException as error:
            # If ElevenLabs fails (quota, invalid voice, payment required etc.),
            # fall back to gTTS so the session doesn't break. Log loudly.
            logger.warning(
                "ElevenLabs failed, falling back to gTTS: %s", error
            )
            return self._synthesize_gtts(text, None)

    def _synthesize_gtts(self, text: str, language_style: LanguageStyle | None) -> bytes:
        resolved_style = language_style if language_style is not None else LanguageStyle.SIMPLE_ENGLISH
        language_code, top_level_domain = LANGUAGE_STYLE_TO_GTTS[resolved_style]

        operation = "synthesize_speech"
        log_external_api_request(logger, "gTTS", operation, text[:100])
        try:
            audio_buffer = io.BytesIO()
            gTTS(text=text, lang=language_code, tld=top_level_domain).write_to_fp(audio_buffer)
            audio_bytes = audio_buffer.getvalue()
        except Exception as error:
            log_external_api_error(logger, "gTTS", operation, error, request_payload=text[:100])
            raise ValidationException(f"TTS synthesis failed: {error}") from error

        log_external_api_response(logger, "gTTS", operation, f"[audio bytes={len(audio_bytes)}]")
        return audio_bytes
