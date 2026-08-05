from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.entities import DoubtMessageEntity, DoubtSessionEntity
from app.domain.enums import DoubtSessionStatus


class DoubtMessageRequestDTO(BaseModel):
    student_message: str


class DoubtMessageResponseDTO(BaseModel):
    message_id: UUID
    student_message: str
    ai_response: str

    @classmethod
    def from_entity(cls, entity: DoubtMessageEntity) -> DoubtMessageResponseDTO:
        return cls(
            message_id=entity.id,
            student_message=entity.student_message,
            ai_response=entity.ai_response,
        )


class DoubtSessionResponseDTO(BaseModel):
    doubt_session_id: UUID
    classroom_session_id: UUID
    topic_id: UUID
    status: DoubtSessionStatus

    @classmethod
    def from_entity(cls, entity: DoubtSessionEntity) -> DoubtSessionResponseDTO:
        return cls(
            doubt_session_id=entity.id,
            classroom_session_id=entity.classroom_session_id,
            topic_id=entity.topic_id,
            status=entity.status,
        )


class DoubtSessionDetailResponseDTO(DoubtSessionResponseDTO):
    messages: list[DoubtMessageResponseDTO] = Field(default_factory=list)
    created_at: datetime | None = None

    @classmethod
    def from_entity_with_messages(
        cls,
        entity: DoubtSessionEntity,
        messages: list[DoubtMessageEntity],
    ) -> DoubtSessionDetailResponseDTO:
        return cls(
            doubt_session_id=entity.id,
            classroom_session_id=entity.classroom_session_id,
            topic_id=entity.topic_id,
            status=entity.status,
            messages=[DoubtMessageResponseDTO.from_entity(message) for message in messages],
            created_at=entity.created_at,
        )
