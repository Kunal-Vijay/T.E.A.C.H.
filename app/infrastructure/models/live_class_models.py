from __future__ import annotations

import uuid

from sqlalchemy import JSON, Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.domain.entities import (
    ClassPlanEntity,
    ClassPlanTopicEntity,
    ClassroomSessionEntity,
    DoubtMessageEntity,
    DoubtSessionEntity,
    GeneratedAssetEntity,
    LiveClassGenerationEntity,
    LiveClassSlideEntity,
    PopQuizAttemptEntity,
    PopQuizQuestionEntity,
    PopQuizOptionEntity,
    SlideElementEntity,
    SlideExplanationEntity,
    TopicWorkflowEntity,
)
from app.domain.enums import (
    AssetStatus,
    ClassroomSessionStatus,
    DoubtSessionStatus,
    GenerationStatus,
    PlanStatus,
    TeachingApproach,
)
from app.infrastructure.models.base import Base, SoftDeleteMixin, TimestampMixin


class ClassPlanModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "class_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    subject = Column(String(100), nullable=False)
    grade = Column(String(50), nullable=False)
    class_label = Column(String(100), nullable=False)
    chapter_name = Column(String(255), nullable=False)
    chapter_number = Column(Integer, nullable=True)
    target_exam = Column(String(100), nullable=False)
    language_code = Column(String(10), nullable=False)
    total_duration_minutes = Column(Integer, nullable=False)
    status = Column(Enum(PlanStatus, name="plan_status"), nullable=False, default=PlanStatus.DRAFT)
    created_by = Column(String(255), nullable=True)

    topics = relationship("ClassPlanTopicModel", back_populates="class_plan", cascade="all, delete-orphan")

    def to_entity(self) -> ClassPlanEntity:
        return ClassPlanEntity(
            id=self.id,
            title=self.title,
            subject=self.subject,
            grade=self.grade,
            class_label=self.class_label,
            chapter_name=self.chapter_name,
            chapter_number=self.chapter_number,
            target_exam=self.target_exam,
            language_code=self.language_code,
            total_duration_minutes=self.total_duration_minutes,
            status=self.status,
            created_by=self.created_by,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
            topics=[topic.to_entity() for topic in self.get_list_relationship_or_empty("topics")],
        )

    @classmethod
    def from_entity(cls, entity: ClassPlanEntity) -> ClassPlanModel:
        model = cls(
            id=entity.id,
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
            is_active=entity.is_active,
        )
        model.topics = [ClassPlanTopicModel.from_entity(topic, entity.id) for topic in entity.topics]
        return model


class ClassPlanTopicModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "class_plan_topics"
    __table_args__ = (UniqueConstraint("class_plan_id", "order", name="uq_class_plan_topics_plan_order"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_plan_id = Column(UUID(as_uuid=True), ForeignKey("class_plans.id"), nullable=False)
    order = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    base_material = Column(Text, nullable=False)
    teaching_guidelines = Column(JSON, nullable=False, default=list)
    miscellaneous_notes = Column(JSON, nullable=True)

    class_plan = relationship("ClassPlanModel", back_populates="topics")

    def to_entity(self) -> ClassPlanTopicEntity:
        return ClassPlanTopicEntity(
            id=self.id,
            class_plan_id=self.class_plan_id,
            order=self.order,
            title=self.title,
            duration_minutes=self.duration_minutes,
            base_material=self.base_material,
            teaching_guidelines=self.teaching_guidelines or [],
            miscellaneous_notes=self.miscellaneous_notes or [],
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: ClassPlanTopicEntity, class_plan_id: uuid.UUID) -> ClassPlanTopicModel:
        return cls(
            id=entity.id,
            class_plan_id=class_plan_id,
            order=entity.order,
            title=entity.title,
            duration_minutes=entity.duration_minutes,
            base_material=entity.base_material,
            teaching_guidelines=entity.teaching_guidelines,
            miscellaneous_notes=entity.miscellaneous_notes,
            is_active=entity.is_active,
        )


class LiveClassGenerationModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "live_class_generations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_plan_id = Column(UUID(as_uuid=True), ForeignKey("class_plans.id"), nullable=False)
    status = Column(Enum(GenerationStatus, name="generation_status"), nullable=False, default=GenerationStatus.PENDING)
    error_message = Column(Text, nullable=True)
    llm_model = Column(String(100), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def to_entity(self) -> LiveClassGenerationEntity:
        return LiveClassGenerationEntity(
            id=self.id,
            class_plan_id=self.class_plan_id,
            status=self.status,
            error_message=self.error_message,
            llm_model=self.llm_model,
            started_at=self.started_at,
            completed_at=self.completed_at,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: LiveClassGenerationEntity) -> LiveClassGenerationModel:
        return cls(
            id=entity.id,
            class_plan_id=entity.class_plan_id,
            status=entity.status,
            error_message=entity.error_message,
            llm_model=entity.llm_model,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
            is_active=entity.is_active,
        )


class TopicWorkflowModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "topic_workflows"
    __table_args__ = (UniqueConstraint("generation_id", "topic_id", name="uq_topic_workflows_generation_topic"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    generation_id = Column(UUID(as_uuid=True), ForeignKey("live_class_generations.id"), nullable=False)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("class_plan_topics.id"), nullable=False)
    teaching_approach = Column(Enum(TeachingApproach, name="teaching_approach"), nullable=False)
    approach_rationale = Column(Text, nullable=False)
    workflow_definition = Column(JSON, nullable=False)

    def to_entity(self) -> TopicWorkflowEntity:
        return TopicWorkflowEntity(
            id=self.id,
            generation_id=self.generation_id,
            topic_id=self.topic_id,
            teaching_approach=self.teaching_approach,
            approach_rationale=self.approach_rationale,
            workflow_definition=self.workflow_definition,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: TopicWorkflowEntity) -> TopicWorkflowModel:
        return cls(
            id=entity.id,
            generation_id=entity.generation_id,
            topic_id=entity.topic_id,
            teaching_approach=entity.teaching_approach,
            approach_rationale=entity.approach_rationale,
            workflow_definition=entity.workflow_definition,
            is_active=entity.is_active,
        )


class LiveClassSlideModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "live_class_slides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    generation_id = Column(UUID(as_uuid=True), ForeignKey("live_class_generations.id"), nullable=False)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("class_plan_topics.id"), nullable=False)
    workflow_state_id = Column(String(100), nullable=False)
    order = Column(Integer, nullable=False)
    layout = Column(String(100), nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    elements = Column(JSON, nullable=False, default=list)

    explanation = relationship(
        "SlideExplanationModel",
        back_populates="slide",
        uselist=False,
    )

    def to_entity(self) -> LiveClassSlideEntity:
        elements = [SlideElementEntity.model_validate(element) for element in (self.elements or [])]
        return LiveClassSlideEntity(
            id=self.id,
            generation_id=self.generation_id,
            topic_id=self.topic_id,
            workflow_state_id=self.workflow_state_id,
            order=self.order,
            layout=self.layout,
            duration_seconds=self.duration_seconds,
            elements=elements,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: LiveClassSlideEntity) -> LiveClassSlideModel:
        return cls(
            id=entity.id,
            generation_id=entity.generation_id,
            topic_id=entity.topic_id,
            workflow_state_id=entity.workflow_state_id,
            order=entity.order,
            layout=entity.layout,
            duration_seconds=entity.duration_seconds,
            elements=[element.model_dump() for element in entity.elements],
            is_active=entity.is_active,
        )


class SlideExplanationModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "slide_explanations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    generation_id = Column(UUID(as_uuid=True), ForeignKey("live_class_generations.id"), nullable=False)
    slide_id = Column(UUID(as_uuid=True), ForeignKey("live_class_slides.id"), unique=True, nullable=False)
    order = Column(Integer, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    explanation_text = Column(Text, nullable=False)

    slide = relationship("LiveClassSlideModel", back_populates="explanation")

    def to_entity(self) -> SlideExplanationEntity:
        return SlideExplanationEntity(
            id=self.id,
            generation_id=self.generation_id,
            slide_id=self.slide_id,
            order=self.order,
            duration_seconds=self.duration_seconds,
            explanation_text=self.explanation_text,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: SlideExplanationEntity) -> SlideExplanationModel:
        return cls(
            id=entity.id,
            generation_id=entity.generation_id,
            slide_id=entity.slide_id,
            order=entity.order,
            duration_seconds=entity.duration_seconds,
            explanation_text=entity.explanation_text,
            is_active=entity.is_active,
        )


class PopQuizQuestionModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "pop_quiz_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    generation_id = Column(UUID(as_uuid=True), ForeignKey("live_class_generations.id"), nullable=False)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("class_plan_topics.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    order = Column(Integer, nullable=False)

    def to_entity(self) -> PopQuizQuestionEntity:
        options = [PopQuizOptionEntity.model_validate(option) for option in (self.options or [])]
        return PopQuizQuestionEntity(
            id=self.id,
            generation_id=self.generation_id,
            topic_id=self.topic_id,
            question_text=self.question_text,
            options=options,
            order=self.order,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: PopQuizQuestionEntity) -> PopQuizQuestionModel:
        return cls(
            id=entity.id,
            generation_id=entity.generation_id,
            topic_id=entity.topic_id,
            question_text=entity.question_text,
            options=[option.model_dump() for option in entity.options],
            order=entity.order,
            is_active=entity.is_active,
        )


class PopQuizAttemptModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "pop_quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("classroom_sessions.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("pop_quiz_questions.id"), nullable=False)
    selected_option_id = Column(String(10), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    feedback_explanation = Column(Text, nullable=False)

    def to_entity(self) -> PopQuizAttemptEntity:
        return PopQuizAttemptEntity(
            id=self.id,
            session_id=self.session_id,
            question_id=self.question_id,
            selected_option_id=self.selected_option_id,
            is_correct=self.is_correct,
            feedback_explanation=self.feedback_explanation,
            is_active=self.is_active,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: PopQuizAttemptEntity) -> PopQuizAttemptModel:
        return cls(
            id=entity.id,
            session_id=entity.session_id,
            question_id=entity.question_id,
            selected_option_id=entity.selected_option_id,
            is_correct=entity.is_correct,
            feedback_explanation=entity.feedback_explanation,
            is_active=entity.is_active,
        )


class ClassroomSessionModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "classroom_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    generation_id = Column(UUID(as_uuid=True), ForeignKey("live_class_generations.id"), nullable=False)
    current_topic_id = Column(UUID(as_uuid=True), ForeignKey("class_plan_topics.id"), nullable=True)
    current_state_id = Column(String(100), nullable=True)
    session_status = Column(
        Enum(ClassroomSessionStatus, name="classroom_session_status"),
        nullable=False,
        default=ClassroomSessionStatus.ACTIVE,
    )
    student_identifier = Column(String(255), nullable=True)

    def to_entity(self) -> ClassroomSessionEntity:
        return ClassroomSessionEntity(
            id=self.id,
            generation_id=self.generation_id,
            current_topic_id=self.current_topic_id,
            current_state_id=self.current_state_id,
            session_status=self.session_status,
            student_identifier=self.student_identifier,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: ClassroomSessionEntity) -> ClassroomSessionModel:
        return cls(
            id=entity.id,
            generation_id=entity.generation_id,
            current_topic_id=entity.current_topic_id,
            current_state_id=entity.current_state_id,
            session_status=entity.session_status,
            student_identifier=entity.student_identifier,
            is_active=entity.is_active,
        )


class DoubtSessionModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "doubt_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_session_id = Column(UUID(as_uuid=True), ForeignKey("classroom_sessions.id"), nullable=False)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("class_plan_topics.id"), nullable=False)
    generation_id = Column(UUID(as_uuid=True), ForeignKey("live_class_generations.id"), nullable=False)
    status = Column(Enum(DoubtSessionStatus, name="doubt_session_status"), nullable=False, default=DoubtSessionStatus.ACTIVE)
    topic_context = Column(JSON, nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    messages = relationship("DoubtMessageModel", back_populates="doubt_session", cascade="all, delete-orphan")

    def to_entity(self) -> DoubtSessionEntity:
        return DoubtSessionEntity(
            id=self.id,
            classroom_session_id=self.classroom_session_id,
            topic_id=self.topic_id,
            generation_id=self.generation_id,
            status=self.status,
            topic_context=self.topic_context,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
            closed_at=self.closed_at,
        )

    @classmethod
    def from_entity(cls, entity: DoubtSessionEntity) -> DoubtSessionModel:
        return cls(
            id=entity.id,
            classroom_session_id=entity.classroom_session_id,
            topic_id=entity.topic_id,
            generation_id=entity.generation_id,
            status=entity.status,
            topic_context=entity.topic_context,
            closed_at=entity.closed_at,
            is_active=entity.is_active,
        )


class DoubtMessageModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "doubt_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doubt_session_id = Column(UUID(as_uuid=True), ForeignKey("doubt_sessions.id"), nullable=False)
    order = Column(Integer, nullable=False)
    student_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)

    doubt_session = relationship("DoubtSessionModel", back_populates="messages")

    def to_entity(self) -> DoubtMessageEntity:
        return DoubtMessageEntity(
            id=self.id,
            doubt_session_id=self.doubt_session_id,
            order=self.order,
            student_message=self.student_message,
            ai_response=self.ai_response,
            is_active=self.is_active,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: DoubtMessageEntity) -> DoubtMessageModel:
        return cls(
            id=entity.id,
            doubt_session_id=entity.doubt_session_id,
            order=entity.order,
            student_message=entity.student_message,
            ai_response=entity.ai_response,
            is_active=entity.is_active,
        )


class GeneratedAssetModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "generated_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    generation_id = Column(UUID(as_uuid=True), ForeignKey("live_class_generations.id"), nullable=False)
    slide_id = Column(UUID(as_uuid=True), ForeignKey("live_class_slides.id"), nullable=False)
    element_id = Column(String(100), nullable=False)
    generation_prompt = Column(Text, nullable=False)
    storage_url = Column(String(1000), nullable=True)
    status = Column(Enum(AssetStatus, name="asset_status"), nullable=False, default=AssetStatus.PENDING)
    error_message = Column(Text, nullable=True)

    def to_entity(self) -> GeneratedAssetEntity:
        return GeneratedAssetEntity(
            id=self.id,
            generation_id=self.generation_id,
            slide_id=self.slide_id,
            element_id=self.element_id,
            generation_prompt=self.generation_prompt,
            storage_url=self.storage_url,
            status=self.status,
            error_message=self.error_message,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: GeneratedAssetEntity) -> GeneratedAssetModel:
        return cls(
            id=entity.id,
            generation_id=entity.generation_id,
            slide_id=entity.slide_id,
            element_id=entity.element_id,
            generation_prompt=entity.generation_prompt,
            storage_url=entity.storage_url,
            status=entity.status,
            error_message=entity.error_message,
            is_active=entity.is_active,
        )
