from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.application.dtos.student.student_profile_dto import StudentParamsOverrideDTO
from app.domain.entities import (
    LearningSessionEntity,
    SessionSlideEntity,
    SessionTurnEntity,
    SessionVisualEntity,
    VivaAssessmentEntity,
)
from app.domain.enums import (
    GoalStatus,
    InputChannel,
    LearningMode,
    LearningSessionStatus,
    SessionTurnRole,
    VivaAdvanceReason,
)
from app.domain.student_params import StudentParamsSnapshot


class StartLearningSessionRequestDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    topic_id: UUID
    mode: LearningMode
    student_identifier: str = Field(min_length=1, max_length=255)
    param_overrides: StudentParamsOverrideDTO | None = None


class SubmitTurnRequestDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message: str = Field(min_length=1)
    channel: InputChannel = InputChannel.CHAT


class VivaAdvanceRequestDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reason: VivaAdvanceReason


class SessionTurnResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order: int
    role: SessionTurnRole
    text: str
    input_channel: InputChannel | None
    created_at: datetime | None

    @classmethod
    def from_entity(cls, entity: SessionTurnEntity) -> SessionTurnResponseDTO:
        return cls(
            id=entity.id,
            order=entity.order,
            role=entity.role,
            text=entity.text,
            input_channel=entity.input_channel,
            created_at=entity.created_at,
        )


class SessionVisualResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_turn_id: UUID
    slides: list[SessionSlideEntity]
    explanation_text: str
    quiz_payload: dict | None

    @classmethod
    def from_entity(cls, entity: SessionVisualEntity) -> SessionVisualResponseDTO:
        return cls(
            id=entity.id,
            session_turn_id=entity.session_turn_id,
            slides=entity.slides,
            explanation_text=entity.explanation_text,
            quiz_payload=entity.quiz_payload,
        )


class VivaAssessmentResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    weak_toc_item_ids: list[str]
    insight_summary: str
    question_evaluations: list[dict]

    @classmethod
    def from_entity(cls, entity: VivaAssessmentEntity) -> VivaAssessmentResponseDTO:
        return cls(
            weak_toc_item_ids=entity.weak_toc_item_ids,
            insight_summary=entity.insight_summary,
            question_evaluations=entity.question_evaluations,
        )


class LearningSessionResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    topic_id: UUID
    mode: LearningMode
    student_identifier: str
    params_snapshot: StudentParamsSnapshot
    status: LearningSessionStatus
    goal_status: GoalStatus
    taught_toc_item_ids: list[str]
    mode_state: dict
    turns: list[SessionTurnResponseDTO]
    current_visual: SessionVisualResponseDTO | None
    viva_assessment: VivaAssessmentResponseDTO | None
    latest_tutor_message: str | None
    created_at: datetime | None
    updated_at: datetime | None
    completed_at: datetime | None

    @classmethod
    def from_entity(
        cls,
        entity: LearningSessionEntity,
        current_visual: SessionVisualEntity | None = None,
    ) -> LearningSessionResponseDTO:
        sorted_turns = sorted(entity.turns, key=lambda turn: turn.order)
        tutor_turns = [turn for turn in sorted_turns if turn.role == SessionTurnRole.TUTOR]
        latest_tutor_message = tutor_turns[-1].text if len(tutor_turns) > 0 else None
        viva = None
        if entity.viva_assessment is not None:
            viva = VivaAssessmentResponseDTO.from_entity(entity.viva_assessment)
        visual_dto = None
        if current_visual is not None:
            visual_dto = SessionVisualResponseDTO.from_entity(current_visual)
        elif len(entity.visuals) > 0:
            latest_visual = sorted(entity.visuals, key=lambda visual: visual.created_at or datetime.min)[-1]
            visual_dto = SessionVisualResponseDTO.from_entity(latest_visual)
        return cls(
            id=entity.id,
            topic_id=entity.topic_id,
            mode=entity.mode,
            student_identifier=entity.student_identifier,
            params_snapshot=entity.params_snapshot,
            status=entity.status,
            goal_status=entity.goal_status,
            taught_toc_item_ids=entity.taught_toc_item_ids,
            mode_state=entity.mode_state,
            turns=[SessionTurnResponseDTO.from_entity(turn) for turn in sorted_turns],
            current_visual=visual_dto,
            viva_assessment=viva,
            latest_tutor_message=latest_tutor_message,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            completed_at=entity.completed_at,
        )
