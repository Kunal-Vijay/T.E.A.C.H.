from __future__ import annotations

from pydantic import BaseModel, ConfigDict, validate_call

from app.domain.enums import (
    AcademicLevel,
    ExamTarget,
    ExplanationDepth,
    InteractionMode,
    KnowledgeLevel,
    LanguageStyle,
    LearningMode,
    LearningStyle,
    Pace,
    PracticePreference,
    PreferredExplanation,
    PrimaryGoal,
    PriorKnowledge,
)
from app.domain.exceptions import ValidationException


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
    knowledge_level: KnowledgeLevel = KnowledgeLevel.BASIC
    preferred_explanation: PreferredExplanation = PreferredExplanation.STEP_BY_STEP


class StudentParamOverrides(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    explanation_depth: ExplanationDepth | None = None
    pace: Pace | None = None
    interaction_mode: InteractionMode | None = None
    knowledge_level: KnowledgeLevel | None = None
    preferred_explanation: PreferredExplanation | None = None


PROFILE_ATTRIBUTE_KEYS = (
    "academic_level",
    "exam_target",
    "prior_knowledge",
    "learning_style",
    "language_style",
    "primary_goal",
    "explanation_depth",
    "pace",
    "interaction_mode",
    "practice_preference",
    "knowledge_level",
    "preferred_explanation",
)

MODE_SESSION_SELECTABLE_KEYS: dict[LearningMode, tuple[str, ...]] = {
    LearningMode.TEACH: ("explanation_depth", "pace", "interaction_mode"),
    LearningMode.DOUBT: ("knowledge_level", "preferred_explanation"),
    LearningMode.VIVA: (),
}

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
    "knowledge_level": [value.value for value in KnowledgeLevel],
    "preferred_explanation": [value.value for value in PreferredExplanation],
}


@validate_call(validate_return=True)
def merge_student_params(
    profile_params: StudentParamsSnapshot,
    overrides: StudentParamOverrides | None,
    mode: LearningMode,
) -> StudentParamsSnapshot:
    merged = profile_params.model_copy(deep=True)
    if overrides is None:
        return merged
    allowed_keys = MODE_SESSION_SELECTABLE_KEYS[mode]
    if "explanation_depth" in allowed_keys and overrides.explanation_depth is not None:
        merged.explanation_depth = overrides.explanation_depth
    if "pace" in allowed_keys and overrides.pace is not None:
        merged.pace = overrides.pace
    if "interaction_mode" in allowed_keys and overrides.interaction_mode is not None:
        merged.interaction_mode = overrides.interaction_mode
    if "knowledge_level" in allowed_keys and overrides.knowledge_level is not None:
        merged.knowledge_level = overrides.knowledge_level
    if "preferred_explanation" in allowed_keys and overrides.preferred_explanation is not None:
        merged.preferred_explanation = overrides.preferred_explanation
    return merged


@validate_call(validate_return=True)
def format_profile_params_for_prompt(params: StudentParamsSnapshot) -> str:
    return (
        f"academic_level={params.academic_level.value}, "
        f"exam_target={params.exam_target.value}, "
        f"prior_knowledge={params.prior_knowledge.value}, "
        f"learning_style={params.learning_style.value}, "
        f"language_style={params.language_style.value}, "
        f"primary_goal={params.primary_goal.value}"
    )


@validate_call(validate_return=True)
def format_teach_params_for_prompt(params: StudentParamsSnapshot) -> str:
    return (
        f"{format_profile_params_for_prompt(params)}, "
        f"explanation_depth={params.explanation_depth.value}, "
        f"pace={params.pace.value}, "
        f"interaction_mode={params.interaction_mode.value}"
    )


@validate_call(validate_return=True)
def format_doubt_params_for_prompt(params: StudentParamsSnapshot) -> str:
    return (
        f"{format_profile_params_for_prompt(params)}, "
        f"knowledge_level={params.knowledge_level.value}, "
        f"preferred_explanation={params.preferred_explanation.value}"
    )


@validate_call(validate_return=True)
def format_viva_params_for_prompt(params: StudentParamsSnapshot) -> str:
    return format_profile_params_for_prompt(params)


@validate_call(validate_return=True)
def default_student_params() -> StudentParamsSnapshot:
    return StudentParamsSnapshot()


@validate_call(validate_return=True)
def validate_overrides_for_mode(
    overrides: StudentParamOverrides | None,
    mode: LearningMode,
) -> None:
    if overrides is None:
        return None
    allowed_keys = set(MODE_SESSION_SELECTABLE_KEYS[mode])
    provided_keys = {
        field_name
        for field_name, field_value in overrides.model_dump(exclude_none=True).items()
        if field_value is not None
    }
    disallowed_keys = provided_keys - allowed_keys
    if len(disallowed_keys) > 0:
        disallowed_list = ", ".join(sorted(disallowed_keys))
        raise ValidationException(
            f"Parameter overrides not allowed for mode {mode.value}: {disallowed_list}"
        )
    return None
