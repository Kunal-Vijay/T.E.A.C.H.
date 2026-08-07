from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.domain.enums import (
    AcademicLevel,
    ExamTarget,
    ExplanationDepth,
    InteractionMode,
    LanguageStyle,
    LearningStyle,
    Pace,
    PracticePreference,
    PrimaryGoal,
    PriorKnowledge,
)


class StudentParamsSnapshot(BaseModel):
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


class StudentParamOverrides(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    explanation_depth: ExplanationDepth | None = None
    pace: Pace | None = None
    interaction_mode: InteractionMode | None = None
    practice_preference: PracticePreference | None = None


PROFILE_ATTRIBUTE_KEYS = (
    "academic_level",
    "exam_target",
    "prior_knowledge",
    "learning_style",
    "language_style",
    "primary_goal",
)

SESSION_SELECTABLE_ATTRIBUTE_KEYS = (
    "explanation_depth",
    "pace",
    "interaction_mode",
    "practice_preference",
)

STUDENT_PARAM_POSSIBLE_VALUES: dict[str, list[str]] = {
    "academic_level": [value.value for value in AcademicLevel],
    "exam_target": [value.value for value in ExamTarget],
    "prior_knowledge": [value.value for value in PriorKnowledge],
    "learning_style": [value.value for value in LearningStyle],
    "explanation_depth": [value.value for value in ExplanationDepth],
    "pace": [value.value for value in Pace],
    "language_style": [value.value for value in LanguageStyle],
    "interaction_mode": [value.value for value in InteractionMode],
    "practice_preference": [value.value for value in PracticePreference],
    "primary_goal": [value.value for value in PrimaryGoal],
}


def merge_student_params(
    profile_params: StudentParamsSnapshot,
    overrides: StudentParamOverrides | None,
) -> StudentParamsSnapshot:
    merged = profile_params.model_copy(deep=True)
    if overrides is None:
        return merged
    if overrides.explanation_depth is not None:
        merged.explanation_depth = overrides.explanation_depth
    if overrides.pace is not None:
        merged.pace = overrides.pace
    if overrides.interaction_mode is not None:
        merged.interaction_mode = overrides.interaction_mode
    if overrides.practice_preference is not None:
        merged.practice_preference = overrides.practice_preference
    return merged


def format_student_params_for_prompt(params: StudentParamsSnapshot) -> str:
    return (
        f"academic_level={params.academic_level.value}, "
        f"exam_target={params.exam_target.value}, "
        f"prior_knowledge={params.prior_knowledge.value}, "
        f"learning_style={params.learning_style.value}, "
        f"explanation_depth={params.explanation_depth.value}, "
        f"pace={params.pace.value}, "
        f"language_style={params.language_style.value}, "
        f"interaction_mode={params.interaction_mode.value}, "
        f"practice_preference={params.practice_preference.value}, "
        f"primary_goal={params.primary_goal.value}"
    )


def default_student_params() -> StudentParamsSnapshot:
    return StudentParamsSnapshot()
