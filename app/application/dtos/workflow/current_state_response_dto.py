from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.entities import TopicWorkflowEntity
from app.domain.enums import WorkflowStateType


class CurrentStateDTO(BaseModel):
    state_id: str
    phase: str
    state_type: WorkflowStateType
    label: str
    requires_student_input: bool = False


class SlideExplanationDTO(BaseModel):
    explanation_text: str
    duration_seconds: int


class CurrentSlideDTO(BaseModel):
    slide_id: UUID
    elements: list[dict] = Field(default_factory=list)
    explanation: SlideExplanationDTO | None = None


class CurrentStateContentDTO(BaseModel):
    slides: list[CurrentSlideDTO] = Field(default_factory=list)


class CurrentStateResponseDTO(BaseModel):
    session_id: UUID
    topic_id: UUID | None = None
    current_state: CurrentStateDTO | None = None
    content: CurrentStateContentDTO = Field(default_factory=CurrentStateContentDTO)
    next_advance_trigger: str | None = None
    session_status: str


class TopicWorkflowResponseDTO(BaseModel):
    topic_id: UUID
    teaching_approach: str
    approach_rationale: str
    workflow_definition: dict

    @classmethod
    def from_entity(cls, entity: TopicWorkflowEntity) -> TopicWorkflowResponseDTO:
        return cls(
            topic_id=entity.topic_id,
            teaching_approach=entity.teaching_approach.value,
            approach_rationale=entity.approach_rationale,
            workflow_definition=entity.workflow_definition,
        )
