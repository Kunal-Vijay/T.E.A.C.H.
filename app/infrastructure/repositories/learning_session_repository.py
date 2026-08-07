from __future__ import annotations

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session, joinedload

from app.domain.entities import (
    LearningSessionEntity,
    SessionQuizAttemptEntity,
    SessionTurnEntity,
    SessionVisualEntity,
    VivaAssessmentEntity,
)
from app.domain.interfaces import ILearningSessionRepository
from app.infrastructure.decorators import log_repo_call
from app.infrastructure.models.learning_session_models import (
    LearningSessionModel,
    SessionQuizAttemptModel,
    SessionTurnModel,
    SessionVisualModel,
    VivaAssessmentModel,
)


class LearningSessionRepository(ILearningSessionRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    @log_repo_call
    @validate_call(validate_return=True)
    def create(self, learning_session: LearningSessionEntity) -> LearningSessionEntity:
        model = LearningSessionModel.from_entity(learning_session)
        self.session.add(model)
        self.session.flush()
        found = self.find_by_id(model.id)
        if found is None:
            raise RuntimeError("Failed to load created learning session")
        return found

    @log_repo_call
    @validate_call(validate_return=True)
    def update(self, learning_session: LearningSessionEntity) -> LearningSessionEntity:
        model = (
            self.session.query(LearningSessionModel)
            .filter(
                LearningSessionModel.id == learning_session.id,
                LearningSessionModel.is_active.is_(True),
            )
            .first()
        )
        if model is None:
            return learning_session
        model.status = learning_session.status
        model.goal_status = learning_session.goal_status
        model.taught_toc_item_ids = learning_session.taught_toc_item_ids
        model.mode_state = learning_session.mode_state
        model.completed_at = learning_session.completed_at
        model.params_snapshot = learning_session.params_snapshot.model_dump(mode="json")
        self.session.flush()
        found = self.find_by_id(learning_session.id)
        if found is None:
            raise RuntimeError("Failed to load updated learning session")
        return found

    @log_repo_call
    @validate_call(validate_return=True)
    def find_by_id(self, session_id: UUID) -> LearningSessionEntity | None:
        model = (
            self.session.query(LearningSessionModel)
            .options(
                joinedload(LearningSessionModel.turns.and_(SessionTurnModel.is_active.is_(True))),
                joinedload(LearningSessionModel.visuals.and_(SessionVisualModel.is_active.is_(True))),
                joinedload(
                    LearningSessionModel.quiz_attempts.and_(SessionQuizAttemptModel.is_active.is_(True))
                ),
                joinedload(
                    LearningSessionModel.viva_assessment.and_(VivaAssessmentModel.is_active.is_(True))
                ),
            )
            .filter(LearningSessionModel.id == session_id, LearningSessionModel.is_active.is_(True))
            .first()
        )
        if model is None:
            return None
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def create_turn(self, turn: SessionTurnEntity) -> SessionTurnEntity:
        model = SessionTurnModel.from_entity(turn)
        self.session.add(model)
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def create_visual(self, visual: SessionVisualEntity) -> SessionVisualEntity:
        model = SessionVisualModel.from_entity(visual)
        self.session.add(model)
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def create_quiz_attempt(self, attempt: SessionQuizAttemptEntity) -> SessionQuizAttemptEntity:
        model = SessionQuizAttemptModel.from_entity(attempt)
        self.session.add(model)
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def upsert_viva_assessment(self, assessment: VivaAssessmentEntity) -> VivaAssessmentEntity:
        existing_model = (
            self.session.query(VivaAssessmentModel)
            .filter(
                VivaAssessmentModel.learning_session_id == assessment.learning_session_id,
                VivaAssessmentModel.is_active.is_(True),
            )
            .first()
        )
        if existing_model is None:
            model = VivaAssessmentModel.from_entity(assessment)
            self.session.add(model)
            self.session.flush()
            return model.to_entity()
        existing_model.weak_toc_item_ids = assessment.weak_toc_item_ids
        existing_model.insight_summary = assessment.insight_summary
        existing_model.question_evaluations = assessment.question_evaluations
        self.session.flush()
        return existing_model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def find_turns_by_session(self, session_id: UUID) -> list[SessionTurnEntity]:
        models = (
            self.session.query(SessionTurnModel)
            .filter(
                SessionTurnModel.learning_session_id == session_id,
                SessionTurnModel.is_active.is_(True),
            )
            .order_by(SessionTurnModel.order.asc())
            .all()
        )
        return [model.to_entity() for model in models]

    @log_repo_call
    @validate_call(validate_return=True)
    def find_latest_visual(self, session_id: UUID) -> SessionVisualEntity | None:
        model = (
            self.session.query(SessionVisualModel)
            .filter(
                SessionVisualModel.learning_session_id == session_id,
                SessionVisualModel.is_active.is_(True),
            )
            .order_by(SessionVisualModel.created_at.desc())
            .first()
        )
        if model is None:
            return None
        return model.to_entity()
