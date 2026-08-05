from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.application.dtos.doubt.doubt_session_dto import (
    DoubtMessageRequestDTO,
    DoubtMessageResponseDTO,
    DoubtSessionDetailResponseDTO,
    DoubtSessionResponseDTO,
)
from app.application.dtos.workflow.current_state_response_dto import CurrentStateResponseDTO
from app.application.services.doubt_session_service import DoubtSessionService
from app.core.dependencies import get_doubt_session_service
from app.domain.exceptions import (
    ClassroomSessionNotFoundException,
    DoubtSessionNotFoundException,
    ValidationException,
)

router = APIRouter(prefix="/api/v1", tags=["Doubt Sessions"])


@router.post("/classroom-sessions/{session_id}/doubt-sessions", status_code=201, response_model=DoubtSessionResponseDTO)
def create_doubt_session(
    session_id: UUID,
    service: DoubtSessionService = Depends(get_doubt_session_service),
) -> DoubtSessionResponseDTO:
    try:
        return service.create_doubt_session(session_id)
    except ClassroomSessionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/doubt-sessions/{doubt_session_id}", response_model=DoubtSessionDetailResponseDTO)
def get_doubt_session(
    doubt_session_id: UUID,
    service: DoubtSessionService = Depends(get_doubt_session_service),
) -> DoubtSessionDetailResponseDTO:
    try:
        return service.get_doubt_session(doubt_session_id)
    except DoubtSessionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/doubt-sessions/{doubt_session_id}/messages", response_model=DoubtMessageResponseDTO)
def ask_doubt(
    doubt_session_id: UUID,
    request_dto: DoubtMessageRequestDTO,
    service: DoubtSessionService = Depends(get_doubt_session_service),
) -> DoubtMessageResponseDTO:
    try:
        return service.ask_doubt(doubt_session_id, request_dto)
    except DoubtSessionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/doubt-sessions/{doubt_session_id}/close", response_model=CurrentStateResponseDTO)
def close_doubt_session(
    doubt_session_id: UUID,
    service: DoubtSessionService = Depends(get_doubt_session_service),
) -> CurrentStateResponseDTO:
    try:
        return service.close_doubt_session(doubt_session_id)
    except DoubtSessionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
