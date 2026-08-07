from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.application.dtos.tts.tts_request_dto import TtsRequestDTO
from app.application.services.tts_service import TtsService
from app.core.dependencies import get_tts_service
from app.domain.exceptions import ValidationException

router = APIRouter(prefix="/api/v1/tts", tags=["Text To Speech"])


@router.post("/speak")
def synthesize_speech(
    request_dto: TtsRequestDTO,
    tts_service: TtsService = Depends(get_tts_service),
) -> Response:
    """Synthesize speech from text.

    When ELEVENLABS_API_KEY is configured and TTS_PROVIDER is "auto" or "elevenlabs",
    this proxies through ElevenLabs using the requested persona's voice. Otherwise
    falls back to gTTS. The API key is never exposed to the frontend.
    """
    try:
        audio_bytes = tts_service.synthesize_speech(
            request_dto.text,
            language_style=request_dto.language_style,
            persona=request_dto.persona,
        )
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/personas")
def list_personas() -> list[dict[str, str]]:
    """Return the available voice personas for the UI to display."""
    from app.infrastructure.elevenlabs.voice_config import list_personas as _list

    return _list()
