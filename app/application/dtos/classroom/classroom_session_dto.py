from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.domain.entities import ClassroomSessionEntity
from app.domain.enums import ClassroomSessionStatus


class CreateClassroomSessionRequestDTO(BaseModel):
    generation_id: UUID
    student_identifier: str | None = None


class ClassroomSessionResponseDTO(BaseModel):
    session_id: UUID
    generation_id: UUID
    current_topic_id: UUID | None = None
    current_state_id: str | None = None
    session_status: ClassroomSessionStatus
    student_identifier: str | None = None
    created_at: datetime | None = None

    @classmethod
    def from_entity(cls, entity: ClassroomSessionEntity) -> ClassroomSessionResponseDTO:
        return cls(
            session_id=entity.id,
            generation_id=entity.generation_id,
            current_topic_id=entity.current_topic_id,
            current_state_id=entity.current_state_id,
            session_status=entity.session_status,
            student_identifier=entity.student_identifier,
            created_at=entity.created_at,
        )


class StudentInputRequestDTO(BaseModel):
    prediction_text: str
