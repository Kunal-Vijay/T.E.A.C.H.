"""Google Cloud Text-to-Speech client.

Uses the official google-cloud-texttospeech SDK. Credentials are resolved via
the standard GOOGLE_APPLICATION_CREDENTIALS environment variable or Application
Default Credentials (ADC).

Includes an in-memory LRU cache so repeated requests for the same text+voice
don't burn quota.
"""

from __future__ import annotations

import hashlib
import logging
from collections import OrderedDict
from threading import Lock

from google.cloud import texttospeech
from pydantic import validate_call

from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.exceptions import ValidationException
from app.infrastructure.tts.voice_config import VoiceSpec, resolve_voice

logger = logging.getLogger(__name__)

MAX_CACHE_SIZE = 100


class _AudioCache:
    """Thread-safe LRU cache for synthesized audio bytes."""

    def __init__(self, max_size: int = MAX_CACHE_SIZE) -> None:
        self._cache: OrderedDict[str, bytes] = OrderedDict()
        self._max_size = max_size
        self._lock = Lock()

    def get(self, key: str) -> bytes | None:
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
                return self._cache[key]
            return None

    def put(self, key: str, audio: bytes) -> None:
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
                return
            self._cache[key] = audio
            while len(self._cache) > self._max_size:
                self._cache.popitem(last=False)


_cache = _AudioCache()


def _cache_key(text: str, voice: VoiceSpec) -> str:
    raw = f"{voice.name}:{voice.language_code}:{text}"
    return hashlib.sha256(raw.encode()).hexdigest()


class GoogleTtsClient:
    """Synthesizes speech via Google Cloud Text-to-Speech."""

    def __init__(self) -> None:
        self._client: texttospeech.TextToSpeechClient | None = None

    def _get_client(self) -> texttospeech.TextToSpeechClient:
        if self._client is None:
            self._client = texttospeech.TextToSpeechClient()
        return self._client

    @validate_call(validate_return=True)
    def synthesize(self, text: str, persona: str | None = None) -> bytes:
        """Synthesize speech from text using the configured persona's voice.

        Returns MP3 audio bytes. Uses an LRU cache to avoid duplicate API calls.
        """
        voice_spec = resolve_voice(persona)
        key = _cache_key(text, voice_spec)

        cached = _cache.get(key)
        if cached is not None:
            logger.debug("TTS cache hit for persona=%s text=%s", persona, text[:40])
            return cached

        operation = f"synthesize persona={persona or 'default'} voice={voice_spec.name}"
        log_external_api_request(logger, "GoogleTTS", operation, text[:100])

        client = self._get_client()

        synthesis_input = texttospeech.SynthesisInput(text=text)

        voice_params = texttospeech.VoiceSelectionParams(
            language_code=voice_spec.language_code,
            name=voice_spec.name,
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,
            pitch=0.0,
        )

        try:
            response = client.synthesize_speech(
                input=synthesis_input,
                voice=voice_params,
                audio_config=audio_config,
            )
        except Exception as error:
            log_external_api_error(logger, "GoogleTTS", operation, error)
            raise ValidationException(f"Google Cloud TTS failed: {error}") from error

        audio_bytes = response.audio_content
        if not audio_bytes or len(audio_bytes) == 0:
            raise ValidationException("Google Cloud TTS returned empty audio")

        log_external_api_response(
            logger, "GoogleTTS", operation, f"[audio bytes={len(audio_bytes)}]"
        )
        _cache.put(key, audio_bytes)
        return audio_bytes
