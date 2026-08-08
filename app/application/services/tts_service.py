"""Text-to-Speech service.

Uses Google Cloud Text-to-Speech as the sole synthesis provider. Voice selection
is driven by the `persona` parameter, which maps to a configured Google voice
via app/infrastructure/tts/voice_config.py.
"""

from __future__ import annotations

import logging

from pydantic import validate_call

from app.core.log_utils import log_external_api_error
from app.domain.exceptions import ValidationException
from app.infrastructure.tts.google_tts_client import GoogleTtsClient

logger = logging.getLogger(__name__)

# Singleton client — reused across requests, holds the LRU cache.
_client = GoogleTtsClient()


class TtsService:
    @validate_call(validate_return=True)
    def synthesize_speech(
        self,
        text: str,
        persona: str | None = None,
        language_style: str | None = None,  # kept for backward compat, ignored
    ) -> bytes:
        """Synthesize speech from text using Google Cloud TTS.

        Args:
            text: The text to synthesize.
            persona: Voice persona ID ("male" or "female"). Determines the Google
                     voice used. Defaults to "male" if not specified.
            language_style: Legacy parameter, ignored. Kept so existing call sites
                           don't break.
        """
        trimmed = text.strip()
        if trimmed == "":
            raise ValidationException("text cannot be empty")
        if len(trimmed) > 5000:
            raise ValidationException("text exceeds maximum length of 5000 characters")

        return _client.synthesize(trimmed, persona)
