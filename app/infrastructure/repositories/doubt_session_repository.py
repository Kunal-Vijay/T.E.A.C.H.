from __future__ import annotations

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session, joinedload

from app.domain.entities import DoubtMessageEntity, DoubtSessionEntity
from app.domain.enums import DoubtSessionStatus
from app.domain.interfaces import IDoubtSessionRepository
from app.infrastructure.decorators import log_repo_call
from app.infrastructure.models.live_class_models import DoubtMessageModel, DoubtSessionModel


class DoubtSessionRepository(IDoubtSessionRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    @log_repo_call
    @validate_call(validate_return=True)
    def create(self, doubt_session: DoubtSessionEntity) -> DoubtSessionEntity:
        model = DoubtSessionModel.from_entity(doubt_session)
        self.session.add(model)
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def update(self, doubt_session: DoubtSessionEntity) -> DoubtSessionEntity:
        model = (
            self.session.query(DoubtSessionModel)
            .filter(DoubtSessionModel.id == doubt_session.id, DoubtSessionModel.is_active.is_(True))
            .first()
        )
        if model is None:
            return doubt_session
        model.status = doubt_session.status
        model.closed_at = doubt_session.closed_at
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def find_by_id(self, doubt_session_id: UUID) -> DoubtSessionEntity | None:
        model = (
            self.session.query(DoubtSessionModel)
            .filter(DoubtSessionModel.id == doubt_session_id, DoubtSessionModel.is_active.is_(True))
            .first()
        )
        return model.to_entity() if model is not None else None

    @log_repo_call
    @validate_call(validate_return=True)
    def find_active_by_session_and_topic(
        self, classroom_session_id: UUID, topic_id: UUID
    ) -> DoubtSessionEntity | None:
        model = (
            self.session.query(DoubtSessionModel)
            .filter(
                DoubtSessionModel.classroom_session_id == classroom_session_id,
                DoubtSessionModel.topic_id == topic_id,
                DoubtSessionModel.status == DoubtSessionStatus.ACTIVE,
                DoubtSessionModel.is_active.is_(True),
            )
            .first()
        )
        return model.to_entity() if model is not None else None

    @log_repo_call
    @validate_call(validate_return=True)
    def create_message(self, message: DoubtMessageEntity) -> DoubtMessageEntity:
        model = DoubtMessageModel.from_entity(message)
        self.session.add(model)
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def find_messages_by_session(self, doubt_session_id: UUID) -> list[DoubtMessageEntity]:
        models = (
            self.session.query(DoubtMessageModel)
            .filter(
                DoubtMessageModel.doubt_session_id == doubt_session_id,
                DoubtMessageModel.is_active.is_(True),
            )
            .order_by(DoubtMessageModel.order.asc())
            .all()
        )
        return [model.to_entity() for model in models]
