from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.domain.entities import LiveClassGenerationEntity
from app.domain.enums import GenerationStatus


class GenerationStartedResponseDTO(BaseModel):
    generation_id: UUID
    status: GenerationStatus


class GenerationProgressDTO(BaseModel):
    slides_generated: int
    images_total: int
    images_completed: int


class GenerationStatusResponseDTO(BaseModel):
    generation_id: UUID
    class_plan_id: UUID
    status: GenerationStatus
    progress: GenerationProgressDTO
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None

    @classmethod
    def from_entity(
        cls,
        entity: LiveClassGenerationEntity,
        slides_generated: int,
        images_total: int,
        images_completed: int,
    ) -> GenerationStatusResponseDTO:
        return cls(
            generation_id=entity.id,
            class_plan_id=entity.class_plan_id,
            status=entity.status,
            progress=GenerationProgressDTO(
                slides_generated=slides_generated,
                images_total=images_total,
                images_completed=images_completed,
            ),
            started_at=entity.started_at,
            completed_at=entity.completed_at,
            error_message=entity.error_message,
        )


class PaginatedGenerationListDTO(BaseModel):
    items: list[GenerationStatusResponseDTO]
    total: int
    page: int
    limit: int
