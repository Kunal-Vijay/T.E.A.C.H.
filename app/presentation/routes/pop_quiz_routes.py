from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.application.dtos.pop_quiz.quiz_attempt_dto import QuizAttemptRequestDTO, QuizAttemptResponseDTO
from app.application.services.pop_quiz_service import PopQuizService
from app.core.dependencies import get_pop_quiz_service
from app.domain.exceptions import (
    ClassroomSessionNotFoundException,
    PopQuizQuestionNotFoundException,
    ValidationException,
)

router = APIRouter(prefix="/api/v1/classroom-sessions", tags=["Pop Quiz"])


@router.post("/{session_id}/quiz-attempts", response_model=QuizAttemptResponseDTO)
def submit_quiz_attempt(
    session_id: UUID,
    request_dto: QuizAttemptRequestDTO,
    service: PopQuizService = Depends(get_pop_quiz_service),
) -> QuizAttemptResponseDTO:
    try:
        return service.submit_attempt(session_id, request_dto)
    except ClassroomSessionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except PopQuizQuestionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
