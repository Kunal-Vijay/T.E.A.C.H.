from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends

from app.application.dtos.learning_session.learning_session_dto import (
    LearningSessionResponseDTO,
    StartLearningSessionRequestDTO,
    SubmitTurnRequestDTO,
    VivaAdvanceRequestDTO,
)
from app.application.services.learning_session_service import LearningSessionService
from app.core.dependencies import get_learning_session_service

router = APIRouter(prefix="/api/v1/learning-sessions", tags=["Learning Sessions"])


@router.post("", status_code=201, response_model=LearningSessionResponseDTO)
def start_learning_session(
    request_dto: StartLearningSessionRequestDTO,
    service: LearningSessionService = Depends(get_learning_session_service),
) -> LearningSessionResponseDTO:
    return service.start_session(request_dto)


@router.get("/{session_id}", response_model=LearningSessionResponseDTO)
def get_learning_session(
    session_id: UUID,
    service: LearningSessionService = Depends(get_learning_session_service),
) -> LearningSessionResponseDTO:
    return service.get_session(session_id)


@router.post("/{session_id}/turns", response_model=LearningSessionResponseDTO)
def submit_turn(
    session_id: UUID,
    request_dto: SubmitTurnRequestDTO,
    service: LearningSessionService = Depends(get_learning_session_service),
) -> LearningSessionResponseDTO:
    return service.submit_turn(session_id, request_dto)


@router.post("/{session_id}/viva/advance", response_model=LearningSessionResponseDTO)
def advance_viva(
    session_id: UUID,
    request_dto: VivaAdvanceRequestDTO,
    service: LearningSessionService = Depends(get_learning_session_service),
) -> LearningSessionResponseDTO:
    return service.advance_viva(session_id, request_dto)


@router.post("/{session_id}/abandon", response_model=LearningSessionResponseDTO)
def abandon_session(
    session_id: UUID,
    service: LearningSessionService = Depends(get_learning_session_service),
) -> LearningSessionResponseDTO:
    return service.abandon_session(session_id)
