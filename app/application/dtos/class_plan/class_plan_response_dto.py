from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.entities import ClassPlanEntity, ClassPlanTopicEntity
from app.domain.enums import PlanStatus


class TopicResponseDTO(BaseModel):
    topic_id: UUID
    order: int
    title: str
    duration_minutes: int
    base_material: str
    teaching_notes: list[str] = Field(default_factory=list)
    miscellaneous_notes: list[str] = Field(default_factory=list)

    @classmethod
    def from_entity(cls, entity: ClassPlanTopicEntity) -> TopicResponseDTO:
        return cls(
            topic_id=entity.id,
            order=entity.order,
            title=entity.title,
            duration_minutes=entity.duration_minutes,
            base_material=entity.base_material,
            teaching_notes=entity.teaching_notes,
            miscellaneous_notes=entity.miscellaneous_notes,
        )


class ClassPlanResponseDTO(BaseModel):
    plan_id: UUID
    title: str
    subject: str
    grade: str
    class_label: str
    chapter_name: str
    chapter_number: int | None = None
    target_exam: str
    language_code: str
    total_duration_minutes: int
    status: PlanStatus
    created_by: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @classmethod
    def from_entity(cls, entity: ClassPlanEntity) -> ClassPlanResponseDTO:
        return cls(
            plan_id=entity.id,
            title=entity.title,
            subject=entity.subject,
            grade=entity.grade,
            class_label=entity.class_label,
            chapter_name=entity.chapter_name,
            chapter_number=entity.chapter_number,
            target_exam=entity.target_exam,
            language_code=entity.language_code,
            total_duration_minutes=entity.total_duration_minutes,
            status=entity.status,
            created_by=entity.created_by,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )


class LatestGenerationSummaryDTO(BaseModel):
    generation_id: UUID
    status: str


class ClassPlanDetailResponseDTO(ClassPlanResponseDTO):
    topics: list[TopicResponseDTO] = Field(default_factory=list)
    latest_generation: LatestGenerationSummaryDTO | None = None

    @classmethod
    def from_entity(
        cls,
        entity: ClassPlanEntity,
        latest_generation: LatestGenerationSummaryDTO | None = None,
    ) -> ClassPlanDetailResponseDTO:
        return cls(
            plan_id=entity.id,
            title=entity.title,
            subject=entity.subject,
            grade=entity.grade,
            class_label=entity.class_label,
            chapter_name=entity.chapter_name,
            chapter_number=entity.chapter_number,
            target_exam=entity.target_exam,
            language_code=entity.language_code,
            total_duration_minutes=entity.total_duration_minutes,
            status=entity.status,
            created_by=entity.created_by,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            topics=[TopicResponseDTO.from_entity(topic) for topic in entity.topics],
            latest_generation=latest_generation,
        )


class PaginatedClassPlanListDTO(BaseModel):
    items: list[ClassPlanResponseDTO]
    total: int
    page: int
    limit: int
