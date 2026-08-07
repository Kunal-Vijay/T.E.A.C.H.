from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response

from app.application.dtos.topic.topic_dto import (
    CreateTopicRequestDTO,
    PaginatedTopicListDTO,
    ReplaceTocRequestDTO,
    TopicResponseDTO,
    UpdateTopicRequestDTO,
)
from app.application.services.topic_service import TopicService
from app.core.dependencies import get_topic_service
from app.domain.enums import TopicStatus

router = APIRouter(prefix="/api/v1/topics", tags=["Topics"])


@router.post("", status_code=201, response_model=TopicResponseDTO)
def create_topic(
    request_dto: CreateTopicRequestDTO,
    service: TopicService = Depends(get_topic_service),
) -> TopicResponseDTO:
    return service.create_topic(request_dto)


@router.get("", response_model=PaginatedTopicListDTO)
def list_topics(
    subject: str | None = Query(default=None),
    status: TopicStatus | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    service: TopicService = Depends(get_topic_service),
) -> PaginatedTopicListDTO:
    return service.list_topics(subject, status, page, limit)


@router.get("/{topic_id}", response_model=TopicResponseDTO)
def get_topic(
    topic_id: UUID,
    service: TopicService = Depends(get_topic_service),
) -> TopicResponseDTO:
    return service.get_topic(topic_id)


@router.put("/{topic_id}", response_model=TopicResponseDTO)
def update_topic(
    topic_id: UUID,
    request_dto: UpdateTopicRequestDTO,
    service: TopicService = Depends(get_topic_service),
) -> TopicResponseDTO:
    return service.update_topic(topic_id, request_dto)


@router.put("/{topic_id}/toc", response_model=TopicResponseDTO)
def replace_toc(
    topic_id: UUID,
    request_dto: ReplaceTocRequestDTO,
    service: TopicService = Depends(get_topic_service),
) -> TopicResponseDTO:
    return service.replace_toc(topic_id, request_dto)


@router.post("/{topic_id}/publish", response_model=TopicResponseDTO)
def publish_topic(
    topic_id: UUID,
    service: TopicService = Depends(get_topic_service),
) -> TopicResponseDTO:
    return service.publish_topic(topic_id)


@router.post("/{topic_id}/unpublish", response_model=TopicResponseDTO)
def unpublish_topic(
    topic_id: UUID,
    service: TopicService = Depends(get_topic_service),
) -> TopicResponseDTO:
    return service.unpublish_topic(topic_id)


@router.delete("/{topic_id}", status_code=204, response_class=Response)
def delete_topic(
    topic_id: UUID,
    service: TopicService = Depends(get_topic_service),
) -> Response:
    service.delete_topic(topic_id)
    return Response(status_code=204)
