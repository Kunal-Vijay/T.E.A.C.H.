from __future__ import annotations

from datetime import datetime
from math import ceil
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.entities import TopicEntity, TopicTocItemEntity
from app.domain.enums import TopicStatus


class TocItemInputDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=500)
    summary: str = Field(min_length=1)
    teaching_notes: list[str] = Field(default_factory=list)


class CreateTopicRequestDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str = Field(min_length=1, max_length=500)
    subject: str = Field(min_length=1, max_length=100)
    description: str = ""
    created_by: str | None = None
    toc_items: list[TocItemInputDTO] = Field(min_length=1)

    @field_validator("toc_items")
    @classmethod
    def validate_unique_orders(cls, toc_items: list[TocItemInputDTO]) -> list[TocItemInputDTO]:
        orders = [item.order for item in toc_items]
        if len(orders) != len(set(orders)):
            raise ValueError("toc_items order values must be unique")
        return toc_items


class UpdateTopicRequestDTO(CreateTopicRequestDTO):
    pass


class ReplaceTocRequestDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    toc_items: list[TocItemInputDTO] = Field(min_length=1)

    @field_validator("toc_items")
    @classmethod
    def validate_unique_orders(cls, toc_items: list[TocItemInputDTO]) -> list[TocItemInputDTO]:
        orders = [item.order for item in toc_items]
        if len(orders) != len(set(orders)):
            raise ValueError("toc_items order values must be unique")
        return toc_items


class TopicTocItemResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order: int
    title: str
    summary: str
    teaching_notes: list[str]

    @classmethod
    def from_entity(cls, entity: TopicTocItemEntity) -> TopicTocItemResponseDTO:
        return cls(
            id=entity.id,
            order=entity.order,
            title=entity.title,
            summary=entity.summary,
            teaching_notes=entity.teaching_notes,
        )


class TopicResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    subject: str
    description: str
    status: TopicStatus
    created_by: str | None
    created_at: datetime | None
    updated_at: datetime | None
    toc_items: list[TopicTocItemResponseDTO]

    @classmethod
    def from_entity(cls, entity: TopicEntity) -> TopicResponseDTO:
        sorted_toc = sorted(entity.toc_items, key=lambda item: item.order)
        return cls(
            id=entity.id,
            title=entity.title,
            subject=entity.subject,
            description=entity.description,
            status=entity.status,
            created_by=entity.created_by,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            toc_items=[TopicTocItemResponseDTO.from_entity(item) for item in sorted_toc],
        )


class PaginatedTopicListDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[TopicResponseDTO]
    total: int
    page: int
    limit: int
    total_pages: int

    @classmethod
    def create(
        cls,
        items: list[TopicResponseDTO],
        total: int,
        page: int,
        limit: int,
    ) -> PaginatedTopicListDTO:
        total_pages = ceil(total / limit) if limit > 0 and total > 0 else 0
        return cls(items=items, total=total, page=page, limit=limit, total_pages=total_pages)
