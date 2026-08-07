from __future__ import annotations

import uuid

from sqlalchemy import JSON, Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.domain.entities import (
    LearningSessionEntity,
    SessionQuizAttemptEntity,
    SessionSlideElementEntity,
    SessionSlideEntity,
    SessionTurnEntity,
    SessionVisualEntity,
    StudentProfileEntity,
    TopicEntity,
    TopicTocItemEntity,
    VivaAssessmentEntity,
)
from app.domain.enums import (
    GoalStatus,
    InputChannel,
    LearningMode,
    LearningSessionStatus,
    SessionTurnRole,
    TopicStatus,
)
from app.domain.student_params import StudentParamsSnapshot
from app.infrastructure.models.base import Base, SoftDeleteMixin, TimestampMixin


class TopicModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    subject = Column(String(100), nullable=False)
    description = Column(Text, nullable=False, default="")
    status = Column(Enum(TopicStatus, name="topic_status"), nullable=False, default=TopicStatus.DRAFT)
    created_by = Column(String(255), nullable=True)

    toc_items = relationship("TopicTocItemModel", back_populates="topic", cascade="all, delete-orphan")

    def to_entity(self) -> TopicEntity:
        return TopicEntity(
            id=self.id,
            title=self.title,
            subject=self.subject,
            description=self.description or "",
            status=self.status,
            created_by=self.created_by,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
            toc_items=[item.to_entity() for item in self.get_list_relationship_or_empty("toc_items")],
        )

    @classmethod
    def from_entity(cls, entity: TopicEntity) -> TopicModel:
        model = cls(
            id=entity.id,
            title=entity.title,
            subject=entity.subject,
            description=entity.description,
            status=entity.status,
            created_by=entity.created_by,
            is_active=entity.is_active,
        )
        model.toc_items = [TopicTocItemModel.from_entity(item, entity.id) for item in entity.toc_items]
        return model


class TopicTocItemModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "topic_toc_items"
    __table_args__ = (UniqueConstraint("topic_id", "order", name="uq_topic_toc_items_topic_order"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False)
    order = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    summary = Column(Text, nullable=False)
    teaching_notes = Column(JSON, nullable=False, default=list)

    topic = relationship("TopicModel", back_populates="toc_items")

    def to_entity(self) -> TopicTocItemEntity:
        return TopicTocItemEntity(
            id=self.id,
            topic_id=self.topic_id,
            order=self.order,
            title=self.title,
            summary=self.summary,
            teaching_notes=self.teaching_notes or [],
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: TopicTocItemEntity, topic_id: uuid.UUID) -> TopicTocItemModel:
        return cls(
            id=entity.id,
            topic_id=topic_id,
            order=entity.order,
            title=entity.title,
            summary=entity.summary,
            teaching_notes=entity.teaching_notes,
            is_active=entity.is_active,
        )


class StudentProfileModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "student_profiles"
    __table_args__ = (UniqueConstraint("student_identifier", name="uq_student_profiles_student_identifier"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_identifier = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=True)
    attributes = Column(JSON, nullable=False, default=dict)

    def to_entity(self) -> StudentProfileEntity:
        return StudentProfileEntity(
            id=self.id,
            student_identifier=self.student_identifier,
            display_name=self.display_name,
            attributes=StudentParamsSnapshot.model_validate(self.attributes or {}),
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: StudentProfileEntity) -> StudentProfileModel:
        return cls(
            id=entity.id,
            student_identifier=entity.student_identifier,
            display_name=entity.display_name,
            attributes=entity.attributes.model_dump(mode="json"),
            is_active=entity.is_active,
        )


class LearningSessionModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "learning_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False)
    mode = Column(Enum(LearningMode, name="learning_mode"), nullable=False)
    student_identifier = Column(String(255), nullable=False)
    params_snapshot = Column(JSON, nullable=False, default=dict)
    status = Column(
        Enum(LearningSessionStatus, name="learning_session_status"),
        nullable=False,
        default=LearningSessionStatus.ACTIVE,
    )
    goal_status = Column(Enum(GoalStatus, name="goal_status"), nullable=False, default=GoalStatus.IN_PROGRESS)
    taught_toc_item_ids = Column(JSON, nullable=False, default=list)
    mode_state = Column(JSON, nullable=False, default=dict)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    turns = relationship("SessionTurnModel", back_populates="learning_session", cascade="all, delete-orphan")
    visuals = relationship("SessionVisualModel", back_populates="learning_session", cascade="all, delete-orphan")
    quiz_attempts = relationship(
        "SessionQuizAttemptModel",
        back_populates="learning_session",
        cascade="all, delete-orphan",
    )
    viva_assessment = relationship(
        "VivaAssessmentModel",
        back_populates="learning_session",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def to_entity(self) -> LearningSessionEntity:
        viva_model = self.get_single_relationship_or_none("viva_assessment")
        return LearningSessionEntity(
            id=self.id,
            topic_id=self.topic_id,
            mode=self.mode,
            student_identifier=self.student_identifier,
            params_snapshot=StudentParamsSnapshot.model_validate(self.params_snapshot or {}),
            status=self.status,
            goal_status=self.goal_status,
            taught_toc_item_ids=self.taught_toc_item_ids or [],
            mode_state=self.mode_state or {},
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
            completed_at=self.completed_at,
            turns=[turn.to_entity() for turn in self.get_list_relationship_or_empty("turns")],
            visuals=[visual.to_entity() for visual in self.get_list_relationship_or_empty("visuals")],
            quiz_attempts=[
                attempt.to_entity() for attempt in self.get_list_relationship_or_empty("quiz_attempts")
            ],
            viva_assessment=viva_model.to_entity() if viva_model is not None else None,
        )

    @classmethod
    def from_entity(cls, entity: LearningSessionEntity) -> LearningSessionModel:
        return cls(
            id=entity.id,
            topic_id=entity.topic_id,
            mode=entity.mode,
            student_identifier=entity.student_identifier,
            params_snapshot=entity.params_snapshot.model_dump(mode="json"),
            status=entity.status,
            goal_status=entity.goal_status,
            taught_toc_item_ids=entity.taught_toc_item_ids,
            mode_state=entity.mode_state,
            is_active=entity.is_active,
            completed_at=entity.completed_at,
        )


class SessionTurnModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "session_turns"
    __table_args__ = (
        UniqueConstraint("learning_session_id", "order", name="uq_session_turns_session_order"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learning_session_id = Column(UUID(as_uuid=True), ForeignKey("learning_sessions.id"), nullable=False)
    order = Column(Integer, nullable=False)
    role = Column(Enum(SessionTurnRole, name="session_turn_role"), nullable=False)
    text = Column(Text, nullable=False)
    input_channel = Column(Enum(InputChannel, name="input_channel"), nullable=True)

    learning_session = relationship("LearningSessionModel", back_populates="turns")

    def to_entity(self) -> SessionTurnEntity:
        return SessionTurnEntity(
            id=self.id,
            learning_session_id=self.learning_session_id,
            order=self.order,
            role=self.role,
            text=self.text,
            input_channel=self.input_channel,
            is_active=self.is_active,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: SessionTurnEntity) -> SessionTurnModel:
        return cls(
            id=entity.id,
            learning_session_id=entity.learning_session_id,
            order=entity.order,
            role=entity.role,
            text=entity.text,
            input_channel=entity.input_channel,
            is_active=entity.is_active,
        )


class SessionVisualModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "session_visuals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learning_session_id = Column(UUID(as_uuid=True), ForeignKey("learning_sessions.id"), nullable=False)
    session_turn_id = Column(UUID(as_uuid=True), ForeignKey("session_turns.id"), nullable=False)
    slides = Column(JSON, nullable=False, default=list)
    explanation_text = Column(Text, nullable=False, default="")
    quiz_payload = Column(JSON, nullable=True)

    learning_session = relationship("LearningSessionModel", back_populates="visuals")

    def to_entity(self) -> SessionVisualEntity:
        raw_slides = self.slides or []
        slides = [
            SessionSlideEntity(
                slide_id=str(slide.get("slide_id", "")),
                layout=str(slide.get("layout", "title_content")),
                elements=[
                    SessionSlideElementEntity(
                        element_id=str(element.get("element_id", "")),
                        type=str(element.get("type", "text")),
                        content=element.get("content"),
                    )
                    for element in slide.get("elements", [])
                    if isinstance(element, dict)
                ],
            )
            for slide in raw_slides
            if isinstance(slide, dict)
        ]
        return SessionVisualEntity(
            id=self.id,
            learning_session_id=self.learning_session_id,
            session_turn_id=self.session_turn_id,
            slides=slides,
            explanation_text=self.explanation_text or "",
            quiz_payload=self.quiz_payload,
            is_active=self.is_active,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: SessionVisualEntity) -> SessionVisualModel:
        return cls(
            id=entity.id,
            learning_session_id=entity.learning_session_id,
            session_turn_id=entity.session_turn_id,
            slides=[slide.model_dump(mode="json") for slide in entity.slides],
            explanation_text=entity.explanation_text,
            quiz_payload=entity.quiz_payload,
            is_active=entity.is_active,
        )


class SessionQuizAttemptModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "session_quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learning_session_id = Column(UUID(as_uuid=True), ForeignKey("learning_sessions.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    selected_option_id = Column(String(100), nullable=True)
    student_answer_text = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    explanation_text = Column(Text, nullable=False, default="")
    order = Column(Integer, nullable=False)

    learning_session = relationship("LearningSessionModel", back_populates="quiz_attempts")

    def to_entity(self) -> SessionQuizAttemptEntity:
        return SessionQuizAttemptEntity(
            id=self.id,
            learning_session_id=self.learning_session_id,
            question_text=self.question_text,
            selected_option_id=self.selected_option_id,
            student_answer_text=self.student_answer_text,
            is_correct=self.is_correct,
            explanation_text=self.explanation_text or "",
            order=self.order,
            is_active=self.is_active,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: SessionQuizAttemptEntity) -> SessionQuizAttemptModel:
        return cls(
            id=entity.id,
            learning_session_id=entity.learning_session_id,
            question_text=entity.question_text,
            selected_option_id=entity.selected_option_id,
            student_answer_text=entity.student_answer_text,
            is_correct=entity.is_correct,
            explanation_text=entity.explanation_text,
            order=entity.order,
            is_active=entity.is_active,
        )


class VivaAssessmentModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "viva_assessments"
    __table_args__ = (UniqueConstraint("learning_session_id", name="uq_viva_assessments_session"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learning_session_id = Column(UUID(as_uuid=True), ForeignKey("learning_sessions.id"), nullable=False)
    weak_toc_item_ids = Column(JSON, nullable=False, default=list)
    insight_summary = Column(Text, nullable=False, default="")
    question_evaluations = Column(JSON, nullable=False, default=list)

    learning_session = relationship("LearningSessionModel", back_populates="viva_assessment")

    def to_entity(self) -> VivaAssessmentEntity:
        return VivaAssessmentEntity(
            id=self.id,
            learning_session_id=self.learning_session_id,
            weak_toc_item_ids=self.weak_toc_item_ids or [],
            insight_summary=self.insight_summary or "",
            question_evaluations=self.question_evaluations or [],
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: VivaAssessmentEntity) -> VivaAssessmentModel:
        return cls(
            id=entity.id,
            learning_session_id=entity.learning_session_id,
            weak_toc_item_ids=entity.weak_toc_item_ids,
            insight_summary=entity.insight_summary,
            question_evaluations=entity.question_evaluations,
            is_active=entity.is_active,
        )
