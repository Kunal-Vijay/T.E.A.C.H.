from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.entities import StudentProfileEntity
from app.domain.enums import (
    AcademicLevel,
    ExamTarget,
    ExplanationDepth,
    InteractionMode,
    KnowledgeLevel,
    LanguageStyle,
    LearningStyle,
    Pace,
    PracticePreference,
    PreferredExplanation,
    PrimaryGoal,
    PriorKnowledge,
)
from app.domain.student_params import STUDENT_PARAM_POSSIBLE_VALUES, StudentParamsSnapshot


class StudentAttributesDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    academic_level: AcademicLevel = AcademicLevel.CLASS_11
    exam_target: ExamTarget = ExamTarget.JEE_MAIN
    prior_knowledge: PriorKnowledge = PriorKnowledge.BASIC
    learning_style: LearningStyle = LearningStyle.EXAMPLES_FIRST
    explanation_depth: ExplanationDepth = ExplanationDepth.DETAILED
    pace: Pace = Pace.MODERATE
    language_style: LanguageStyle = LanguageStyle.SIMPLE_ENGLISH
    interaction_mode: InteractionMode = InteractionMode.GUIDED
    practice_preference: PracticePreference = PracticePreference.BALANCED
    primary_goal: PrimaryGoal = PrimaryGoal.CONCEPT_MASTERY
    knowledge_level: KnowledgeLevel = KnowledgeLevel.BASIC
    preferred_explanation: PreferredExplanation = PreferredExplanation.STEP_BY_STEP

    def to_snapshot(self) -> StudentParamsSnapshot:
        return StudentParamsSnapshot.model_validate(self.model_dump())


class UpdateStudentProfileRequestDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    display_name: str | None = None
    attributes: StudentAttributesDTO


class StudentAttributeFieldDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    value: str
    possible_values: list[str]


class StudentProfileResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_identifier: str
    display_name: str | None
    attributes: dict[str, StudentAttributeFieldDTO]
    created_at: datetime | None
    updated_at: datetime | None

    @classmethod
    def from_entity(cls, entity: StudentProfileEntity) -> StudentProfileResponseDTO:
        snapshot = entity.attributes.model_dump(mode="json")
        attributes = {
            key: StudentAttributeFieldDTO(
                value=str(snapshot[key]),
                possible_values=STUDENT_PARAM_POSSIBLE_VALUES[key],
            )
            for key in STUDENT_PARAM_POSSIBLE_VALUES
            if key in snapshot
        }
        return cls(
            id=entity.id,
            student_identifier=entity.student_identifier,
            display_name=entity.display_name,
            attributes=attributes,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )


class StudentParamsOverrideDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    explanation_depth: ExplanationDepth | None = None
    pace: Pace | None = None
    interaction_mode: InteractionMode | None = None
    knowledge_level: KnowledgeLevel | None = None
    preferred_explanation: PreferredExplanation | None = None
