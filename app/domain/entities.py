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
    PlanStatus,
    TeachingApproach,
    WorkflowPhase,
    WorkflowStateType,
)
from app.domain.workflow_state_normalizer import normalize_workflow_state


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
    quiz_question_ids: list[str] = Field(default_factory=list)
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
        raw_states = self.workflow_definition.get("states", [])
        return [
            WorkflowStateEntity.model_validate(normalize_workflow_state(state))
            for state in raw_states
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


class PopQuizOptionEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    option_id: str
    text: str
    is_correct: bool
    feedback_explanation: str


class PopQuizQuestionEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    generation_id: UUID
    topic_id: UUID
    question_text: str
    options: list[PopQuizOptionEntity] = Field(default_factory=list)
    order: int
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PopQuizAttemptEntity(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    question_id: UUID
    selected_option_id: str
    is_correct: bool
    feedback_explanation: str
    is_active: bool = True
    created_at: datetime | None = None


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
