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
    """Synthesize speech from text using Google Cloud TTS.

    The persona parameter selects the voice. Available personas can be
    retrieved from GET /api/v1/tts/personas.
    """
    try:
        audio_bytes = tts_service.synthesize_speech(
            request_dto.text,
            persona=request_dto.persona,
            language_style=(
                request_dto.language_style.value
                if request_dto.language_style is not None
                else None
            ),
        )
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/personas")
def list_personas() -> list[dict[str, str]]:
    """Return the available voice personas."""
    from app.infrastructure.tts.voice_config import list_personas as _list

    return _list()
