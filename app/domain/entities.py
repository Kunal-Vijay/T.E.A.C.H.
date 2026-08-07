from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import (
    AdvanceTrigger,
    AssetStatus,
    ClassroomSessionStatus,
    DoubtSessionStatus,
    GenerationStatus,
    GoalStatus,
    InputChannel,
    LearningMode,
    LearningSessionStatus,
    PlanStatus,
    SessionTurnRole,
    TeachingApproach,
    TopicStatus,
    WorkflowPhase,
    WorkflowStateType,
)
from app.domain.student_params import StudentParamsSnapshot
from app.domain.workflow_state_normalizer import normalize_workflow_definition


class ClassPlanTopicEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    class_plan_id: UUID
    order: int
    title: str
    duration_minutes: int
    base_material: str
    teaching_guidelines: list[str] = Field(default_factory=list)
    miscellaneous_notes: list[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ClassPlanEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    subject: str
    grade: str
    class_label: str
    chapter_name: str
    chapter_number: int | None = None
    target_exam: str
    language_code: str
    total_duration_minutes: int
    status: PlanStatus
    created_by: str | None = None
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
    topics: list[ClassPlanTopicEntity] = Field(default_factory=list)


class LiveClassGenerationEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    class_plan_id: UUID
    status: GenerationStatus
    error_message: str | None = None
    llm_model: str
    started_at: datetime | None = None
    completed_at: datetime | None = None
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class WorkflowStateEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    state_id: str
    phase: WorkflowPhase
    state_type: WorkflowStateType
    order: int
    label: str
    slide_ids: list[str] = Field(default_factory=list)
    requires_student_input: bool = False
    student_input_type: str | None = None
    advance_trigger: AdvanceTrigger


class TopicWorkflowEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    generation_id: UUID
    topic_id: UUID
    teaching_approach: TeachingApproach
    approach_rationale: str
    workflow_definition: dict
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @property
    def states(self) -> list[WorkflowStateEntity]:
        normalized_definition = normalize_workflow_definition(self.workflow_definition)
        return [
            WorkflowStateEntity.model_validate(state)
            for state in normalized_definition.get("states", [])
            if isinstance(state, dict)
        ]


class SlideElementEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    element_id: str
    type: str
    content: str | list[str] | None = None
    generation_prompt: str | None = None
    asset_url: str | None = None


class LiveClassSlideEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    generation_id: UUID
    topic_id: UUID
    workflow_state_id: str
    order: int
    layout: str
    duration_seconds: int
    elements: list[SlideElementEntity] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SlideExplanationEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    generation_id: UUID
    slide_id: UUID
    order: int
    duration_seconds: int
    explanation_text: str
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ClassroomSessionEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    generation_id: UUID
    current_topic_id: UUID | None = None
    current_state_id: str | None = None
    session_status: ClassroomSessionStatus
    student_identifier: str | None = None
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DoubtSessionEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    classroom_session_id: UUID
    topic_id: UUID
    generation_id: UUID
    status: DoubtSessionStatus
    topic_context: dict
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
    closed_at: datetime | None = None


class DoubtMessageEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    doubt_session_id: UUID
    order: int
    student_message: str
    ai_response: str
    is_active: bool = True
    created_at: datetime | None = None


class GeneratedAssetEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    generation_id: UUID
    slide_id: UUID
    element_id: str
    generation_prompt: str
    storage_url: str | None = None
    status: AssetStatus
    error_message: str | None = None
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TopicTocItemEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    topic_id: UUID
    order: int
    title: str
    summary: str
    teaching_notes: list[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TopicEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    subject: str
    description: str
    status: TopicStatus
    created_by: str | None = None
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
    toc_items: list[TopicTocItemEntity] = Field(default_factory=list)


class StudentProfileEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_identifier: str
    display_name: str | None = None
    attributes: StudentParamsSnapshot
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SessionSlideElementEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    element_id: str
    type: str
    content: str | list[str] | None = None


class SessionSlideEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slide_id: str
    layout: str
    elements: list[SessionSlideElementEntity] = Field(default_factory=list)


class SessionTurnEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    learning_session_id: UUID
    order: int
    role: SessionTurnRole
    text: str
    input_channel: InputChannel | None = None
    is_active: bool = True
    created_at: datetime | None = None


class SessionVisualEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    learning_session_id: UUID
    session_turn_id: UUID
    slides: list[SessionSlideEntity] = Field(default_factory=list)
    explanation_text: str
    quiz_payload: dict | None = None
    is_active: bool = True
    created_at: datetime | None = None


class VivaAssessmentEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    learning_session_id: UUID
    weak_toc_item_ids: list[str] = Field(default_factory=list)
    insight_summary: str
    question_evaluations: list[dict] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class LearningSessionEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    topic_id: UUID
    mode: LearningMode
    student_identifier: str
    params_snapshot: StudentParamsSnapshot
    status: LearningSessionStatus
    goal_status: GoalStatus
    taught_toc_item_ids: list[str] = Field(default_factory=list)
    mode_state: dict = Field(default_factory=dict)
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
    completed_at: datetime | None = None
    turns: list[SessionTurnEntity] = Field(default_factory=list)
    visuals: list[SessionVisualEntity] = Field(default_factory=list)
    viva_assessment: VivaAssessmentEntity | None = None
