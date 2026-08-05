from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel

from app.domain.entities import PopQuizAttemptEntity


class QuizAttemptRequestDTO(BaseModel):
    question_id: UUID
    selected_option_id: str


class QuizAttemptResponseDTO(BaseModel):
    attempt_id: UUID
    question_id: UUID
    selected_option_id: str
    is_correct: bool
    feedback_explanation: str

    @classmethod
    def from_entity(cls, entity: PopQuizAttemptEntity) -> QuizAttemptResponseDTO:
        return cls(
            attempt_id=entity.id,
            question_id=entity.question_id,
            selected_option_id=entity.selected_option_id,
            is_correct=entity.is_correct,
            feedback_explanation=entity.feedback_explanation,
        )
