from __future__ import annotations

import uuid

from pydantic import validate_call

from app.application.dtos.topic.topic_dto import (
    CreateTopicRequestDTO,
    PaginatedTopicListDTO,
    ReplaceTocRequestDTO,
    TopicResponseDTO,
    UpdateTopicRequestDTO,
)
from app.domain.entities import TopicEntity, TopicTocItemEntity
from app.domain.enums import TopicStatus
from app.domain.exceptions import TopicNotFoundException, ValidationException
from app.domain.interfaces import IUnitOfWork


class TopicService:
    def __init__(self, unit_of_work: IUnitOfWork) -> None:
        self.unit_of_work = unit_of_work

    @validate_call(validate_return=True)
    def create_topic(self, request_dto: CreateTopicRequestDTO) -> TopicResponseDTO:
        topic_id = uuid.uuid4()
        toc_items = [
            TopicTocItemEntity(
                id=uuid.uuid4(),
                topic_id=topic_id,
                order=item.order,
                title=item.title,
                summary=item.summary,
                teaching_notes=item.teaching_notes,
            )
            for item in request_dto.toc_items
        ]
        topic_entity = TopicEntity(
            id=topic_id,
            title=request_dto.title,
            subject=request_dto.subject,
            description=request_dto.description,
            status=TopicStatus.DRAFT,
            created_by=request_dto.created_by,
            toc_items=toc_items,
        )
        with self.unit_of_work:
            created = self.unit_of_work.topic_repository.create(topic_entity)
        return TopicResponseDTO.from_entity(created)

    @validate_call(validate_return=True)
    def update_topic(self, topic_id: uuid.UUID, request_dto: UpdateTopicRequestDTO) -> TopicResponseDTO:
        with self.unit_of_work:
            existing = self.unit_of_work.topic_repository.find_by_id(topic_id)
            if existing is None:
                raise TopicNotFoundException(f"Topic {topic_id} not found")
            if existing.status != TopicStatus.DRAFT:
                raise ValidationException("Only draft topics can be updated")
            updated = TopicEntity(
                id=existing.id,
                title=request_dto.title,
                subject=request_dto.subject,
                description=request_dto.description,
                status=existing.status,
                created_by=existing.created_by,
                toc_items=[
                    TopicTocItemEntity(
                        id=uuid.uuid4(),
                        topic_id=existing.id,
                        order=item.order,
                        title=item.title,
                        summary=item.summary,
                        teaching_notes=item.teaching_notes,
                    )
                    for item in request_dto.toc_items
                ],
            )
            saved = self.unit_of_work.topic_repository.update(updated)
        return TopicResponseDTO.from_entity(saved)

    @validate_call(validate_return=True)
    def replace_toc(self, topic_id: uuid.UUID, request_dto: ReplaceTocRequestDTO) -> TopicResponseDTO:
        with self.unit_of_work:
            existing = self.unit_of_work.topic_repository.find_by_id(topic_id)
            if existing is None:
                raise TopicNotFoundException(f"Topic {topic_id} not found")
            if existing.status != TopicStatus.DRAFT:
                raise ValidationException("Only draft topics can update TOC")
            toc_items = [
                TopicTocItemEntity(
                    id=uuid.uuid4(),
                    topic_id=topic_id,
                    order=item.order,
                    title=item.title,
                    summary=item.summary,
                    teaching_notes=item.teaching_notes,
                )
                for item in request_dto.toc_items
            ]
            saved = self.unit_of_work.topic_repository.replace_toc_items(topic_id, toc_items)
        return TopicResponseDTO.from_entity(saved)

    @validate_call(validate_return=True)
    def get_topic(self, topic_id: uuid.UUID) -> TopicResponseDTO:
        with self.unit_of_work:
            topic = self.unit_of_work.topic_repository.find_by_id(topic_id)
            if topic is None:
                raise TopicNotFoundException(f"Topic {topic_id} not found")
        return TopicResponseDTO.from_entity(topic)

    @validate_call(validate_return=True)
    def list_topics(
        self,
        subject: str | None,
        status: TopicStatus | None,
        page: int,
        limit: int,
    ) -> PaginatedTopicListDTO:
        offset = (page - 1) * limit
        with self.unit_of_work:
            topics, total = self.unit_of_work.topic_repository.find_all(subject, status, offset, limit)
        return PaginatedTopicListDTO.create(
            items=[TopicResponseDTO.from_entity(topic) for topic in topics],
            total=total,
            page=page,
            limit=limit,
        )

    @validate_call(validate_return=True)
    def publish_topic(self, topic_id: uuid.UUID) -> TopicResponseDTO:
        with self.unit_of_work:
            topic = self.unit_of_work.topic_repository.find_by_id(topic_id)
            if topic is None:
                raise TopicNotFoundException(f"Topic {topic_id} not found")
            if len(topic.toc_items) == 0:
                raise ValidationException("Topic must have TOC items before publishing")
            saved = self.unit_of_work.topic_repository.update_status(topic_id, TopicStatus.PUBLISHED)
        return TopicResponseDTO.from_entity(saved)

    @validate_call(validate_return=True)
    def unpublish_topic(self, topic_id: uuid.UUID) -> TopicResponseDTO:
        with self.unit_of_work:
            topic = self.unit_of_work.topic_repository.find_by_id(topic_id)
            if topic is None:
                raise TopicNotFoundException(f"Topic {topic_id} not found")
            saved = self.unit_of_work.topic_repository.update_status(topic_id, TopicStatus.DRAFT)
        return TopicResponseDTO.from_entity(saved)

    @validate_call(validate_return=True)
    def delete_topic(self, topic_id: uuid.UUID) -> None:
        with self.unit_of_work:
            topic = self.unit_of_work.topic_repository.find_by_id(topic_id)
            if topic is None:
                raise TopicNotFoundException(f"Topic {topic_id} not found")
            self.unit_of_work.topic_repository.soft_delete(topic_id)
        return None
