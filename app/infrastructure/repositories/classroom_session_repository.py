from __future__ import annotations

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session

from app.domain.entities import ClassroomSessionEntity, PopQuizAttemptEntity
from app.domain.interfaces import IClassroomSessionRepository
from app.infrastructure.decorators import log_repo_call
from app.infrastructure.models.live_class_models import ClassroomSessionModel, PopQuizAttemptModel, PopQuizQuestionModel


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

    @log_repo_call
    @validate_call(validate_return=True)
    def create_quiz_attempt(self, attempt: PopQuizAttemptEntity) -> PopQuizAttemptEntity:
        model = PopQuizAttemptModel.from_entity(attempt)
        self.session.add(model)
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def find_quiz_attempts_by_session_and_questions(
        self, session_id: UUID, question_ids: list[UUID]
    ) -> list[PopQuizAttemptEntity]:
        if len(question_ids) == 0:
            return []
        models = (
            self.session.query(PopQuizAttemptModel)
            .filter(
                PopQuizAttemptModel.session_id == session_id,
                PopQuizAttemptModel.question_id.in_(question_ids),
                PopQuizAttemptModel.is_active.is_(True),
            )
            .all()
        )
        return [model.to_entity() for model in models]

    @log_repo_call
    @validate_call(validate_return=True)
    def find_quiz_attempts_by_session_and_topic(
        self, session_id: UUID, generation_id: UUID, topic_id: UUID
    ) -> list[PopQuizAttemptEntity]:
        models = (
            self.session.query(PopQuizAttemptModel)
            .join(PopQuizQuestionModel, PopQuizAttemptModel.question_id == PopQuizQuestionModel.id)
            .filter(
                PopQuizAttemptModel.session_id == session_id,
                PopQuizQuestionModel.generation_id == generation_id,
                PopQuizQuestionModel.topic_id == topic_id,
                PopQuizAttemptModel.is_active.is_(True),
                PopQuizQuestionModel.is_active.is_(True),
            )
            .all()
        )
        return [model.to_entity() for model in models]
