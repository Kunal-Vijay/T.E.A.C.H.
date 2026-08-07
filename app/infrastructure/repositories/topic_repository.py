from __future__ import annotations

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session, joinedload

from app.domain.entities import TopicEntity, TopicTocItemEntity
from app.domain.enums import TopicStatus
from app.domain.interfaces import ITopicRepository
from app.infrastructure.decorators import log_repo_call
from app.infrastructure.models.learning_session_models import TopicModel, TopicTocItemModel


class TopicRepository(ITopicRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    @log_repo_call
    @validate_call(validate_return=True)
    def create(self, topic: TopicEntity) -> TopicEntity:
        model = TopicModel.from_entity(topic)
        self.session.add(model)
        self.session.flush()
        found = self.find_by_id(model.id)
        if found is None:
            raise RuntimeError("Failed to load created topic")
        return found

    @log_repo_call
    @validate_call(validate_return=True)
    def update(self, topic: TopicEntity) -> TopicEntity:
        existing_model = (
            self.session.query(TopicModel)
            .options(joinedload(TopicModel.toc_items.and_(TopicTocItemModel.is_active.is_(True))))
            .filter(TopicModel.id == topic.id, TopicModel.is_active.is_(True))
            .first()
        )
        if existing_model is None:
            return topic
        existing_model.title = topic.title
        existing_model.subject = topic.subject
        existing_model.description = topic.description
        existing_model.status = topic.status
        existing_model.created_by = topic.created_by
        for toc_item_model in existing_model.toc_items:
            toc_item_model.is_active = False
        for toc_item_entity in topic.toc_items:
            self.session.add(TopicTocItemModel.from_entity(toc_item_entity, topic.id))
        self.session.flush()
        found = self.find_by_id(topic.id)
        if found is None:
            raise RuntimeError("Failed to load updated topic")
        return found

    @log_repo_call
    @validate_call(validate_return=True)
    def find_by_id(self, topic_id: UUID) -> TopicEntity | None:
        model = (
            self.session.query(TopicModel)
            .options(joinedload(TopicModel.toc_items.and_(TopicTocItemModel.is_active.is_(True))))
            .filter(TopicModel.id == topic_id, TopicModel.is_active.is_(True))
            .first()
        )
        if model is None:
            return None
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def find_all(
        self,
        subject: str | None,
        status: TopicStatus | None,
        offset: int,
        limit: int,
    ) -> tuple[list[TopicEntity], int]:
        query = (
            self.session.query(TopicModel)
            .options(joinedload(TopicModel.toc_items.and_(TopicTocItemModel.is_active.is_(True))))
            .filter(TopicModel.is_active.is_(True))
        )
        if subject is not None:
            query = query.filter(TopicModel.subject == subject)
        if status is not None:
            query = query.filter(TopicModel.status == status)
        total_count = query.count()
        models = query.order_by(TopicModel.created_at.desc()).offset(offset).limit(limit).all()
        return [model.to_entity() for model in models], total_count

    @log_repo_call
    @validate_call(validate_return=True)
    def update_status(self, topic_id: UUID, status: TopicStatus) -> TopicEntity:
        model = (
            self.session.query(TopicModel)
            .options(joinedload(TopicModel.toc_items.and_(TopicTocItemModel.is_active.is_(True))))
            .filter(TopicModel.id == topic_id, TopicModel.is_active.is_(True))
            .first()
        )
        if model is None:
            raise RuntimeError(f"Topic {topic_id} not found")
        model.status = status
        self.session.flush()
        found = self.find_by_id(topic_id)
        if found is None:
            raise RuntimeError("Failed to load topic after status update")
        return found

    @log_repo_call
    @validate_call(validate_return=True)
    def soft_delete(self, topic_id: UUID) -> None:
        model = (
            self.session.query(TopicModel)
            .filter(TopicModel.id == topic_id, TopicModel.is_active.is_(True))
            .first()
        )
        if model is None:
            return None
        model.is_active = False
        for toc_item in (
            self.session.query(TopicTocItemModel)
            .filter(TopicTocItemModel.topic_id == topic_id, TopicTocItemModel.is_active.is_(True))
            .all()
        ):
            toc_item.is_active = False
        self.session.flush()
        return None

    @log_repo_call
    @validate_call(validate_return=True)
    def replace_toc_items(self, topic_id: UUID, toc_items: list[TopicTocItemEntity]) -> TopicEntity:
        existing_model = (
            self.session.query(TopicModel)
            .options(joinedload(TopicModel.toc_items.and_(TopicTocItemModel.is_active.is_(True))))
            .filter(TopicModel.id == topic_id, TopicModel.is_active.is_(True))
            .first()
        )
        if existing_model is None:
            raise RuntimeError(f"Topic {topic_id} not found")
        for toc_item_model in existing_model.toc_items:
            toc_item_model.is_active = False
        for toc_item_entity in toc_items:
            self.session.add(TopicTocItemModel.from_entity(toc_item_entity, topic_id))
        self.session.flush()
        found = self.find_by_id(topic_id)
        if found is None:
            raise RuntimeError("Failed to load topic after TOC replace")
        return found
