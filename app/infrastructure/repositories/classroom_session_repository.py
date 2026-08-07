from __future__ import annotations

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session

from app.domain.entities import ClassroomSessionEntity
from app.domain.interfaces import IClassroomSessionRepository
from app.infrastructure.decorators import log_repo_call
from app.infrastructure.models.live_class_models import ClassroomSessionModel


class ClassroomSessionRepository(IClassroomSessionRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    @log_repo_call
    @validate_call(validate_return=True)
    def create(self, session_entity: ClassroomSessionEntity) -> ClassroomSessionEntity:
        model = ClassroomSessionModel.from_entity(session_entity)
        self.session.add(model)
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def update(self, session_entity: ClassroomSessionEntity) -> ClassroomSessionEntity:
        model = (
            self.session.query(ClassroomSessionModel)
            .filter(ClassroomSessionModel.id == session_entity.id, ClassroomSessionModel.is_active.is_(True))
            .first()
        )
        if model is None:
            return session_entity
        model.current_topic_id = session_entity.current_topic_id
        model.current_state_id = session_entity.current_state_id
        model.session_status = session_entity.session_status
        model.student_identifier = session_entity.student_identifier
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def find_by_id(self, session_id: UUID) -> ClassroomSessionEntity | None:
        model = (
            self.session.query(ClassroomSessionModel)
            .filter(ClassroomSessionModel.id == session_id, ClassroomSessionModel.is_active.is_(True))
            .first()
        )
        return model.to_entity() if model is not None else None
