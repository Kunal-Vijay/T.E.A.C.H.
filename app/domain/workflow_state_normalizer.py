from __future__ import annotations

from typing import Any

from pydantic import validate_call

from app.domain.enums import AdvanceTrigger, WorkflowPhase, WorkflowStateType

VALID_WORKFLOW_STATE_TYPES = {state_type.value for state_type in WorkflowStateType}
VALID_ADVANCE_TRIGGERS = {advance_trigger.value for advance_trigger in AdvanceTrigger}
VALID_WORKFLOW_PHASES = {workflow_phase.value for workflow_phase in WorkflowPhase}

REMOVED_STATE_TYPES = {"pop_quiz", "quiz", "assessment"}
REMOVED_PHASES = {"pop_quiz"}
REMOVED_ADVANCE_TRIGGERS = {"all_questions_attempted", "all_answered", "quiz_complete"}

STATE_TYPE_ALIASES: dict[str, str] = {
    "introduction": WorkflowStateType.EXPLAIN.value,
    "intro": WorkflowStateType.EXPLAIN.value,
    "overview": WorkflowStateType.EXPLAIN.value,
    "concept": WorkflowStateType.EXPLAIN.value,
    "content": WorkflowStateType.EXPLAIN.value,
    "teach": WorkflowStateType.EXPLAIN.value,
    "lesson": WorkflowStateType.EXPLAIN.value,
    "example": WorkflowStateType.EXAMPLES.value,
    "practice": WorkflowStateType.EXAMPLES.value,
    "question": WorkflowStateType.ASK_QUESTION.value,
    "ask": WorkflowStateType.ASK_QUESTION.value,
    "predict": WorkflowStateType.STUDENT_PREDICT.value,
    "prediction": WorkflowStateType.STUDENT_PREDICT.value,
    "doubt": WorkflowStateType.DOUBTS_RESOLUTION.value,
    "doubts": WorkflowStateType.DOUBTS_RESOLUTION.value,
    "sage": WorkflowStateType.DOUBTS_RESOLUTION.value,
}

ADVANCE_TRIGGER_ALIASES: dict[str, str] = {
    "user_next": AdvanceTrigger.AUTO.value,
    "next": AdvanceTrigger.AUTO.value,
    "manual": AdvanceTrigger.AUTO.value,
    "continue": AdvanceTrigger.AUTO.value,
    "on_complete": AdvanceTrigger.AUTO.value,
    "user_submit": AdvanceTrigger.STUDENT_SUBMITTED.value,
    "submit": AdvanceTrigger.STUDENT_SUBMITTED.value,
    "student_input": AdvanceTrigger.STUDENT_SUBMITTED.value,
    "doubt_closed": AdvanceTrigger.DOUBT_SESSION_CLOSED_OR_SKIPPED.value,
    "skip": AdvanceTrigger.DOUBT_SESSION_CLOSED_OR_SKIPPED.value,
}


@validate_call(validate_return=True)
def normalize_workflow_state(state: dict[str, Any]) -> dict[str, Any]:
    normalized_state = dict(state)
    resolved_state_type = resolve_state_type(normalized_state)
    normalized_state["state_type"] = resolved_state_type
    normalized_state["phase"] = resolve_workflow_phase(normalized_state, resolved_state_type)
    normalized_state["advance_trigger"] = resolve_advance_trigger(normalized_state, resolved_state_type)
    if normalized_state.get("requires_student_input") is None:
        normalized_state["requires_student_input"] = resolved_state_type == WorkflowStateType.STUDENT_PREDICT.value
    if "quiz_question_ids" in normalized_state:
        normalized_state["quiz_question_ids"] = []
    return normalized_state


@validate_call(validate_return=True)
def normalize_workflow_definition(workflow_definition: dict[str, Any]) -> dict[str, Any]:
    normalized_definition = dict(workflow_definition)
    raw_states = workflow_definition.get("states", [])
    normalized_states = [
        normalize_workflow_state(state)
        for state in raw_states
        if isinstance(state, dict) and _is_supported_workflow_state(state)
    ]
    normalized_definition["states"] = normalized_states
    return normalized_definition


@validate_call(validate_return=True)
def resolve_workflow_phase(state: dict[str, Any], state_type: str) -> str:
    raw_phase = str(state.get("phase", "")).lower().replace("-", "_").replace(" ", "_")
    if raw_phase in REMOVED_PHASES:
        return WorkflowPhase.TEACH.value
    if raw_phase in VALID_WORKFLOW_PHASES:
        return raw_phase
    if state_type == WorkflowStateType.DOUBTS_RESOLUTION.value:
        return WorkflowPhase.DOUBTS_RESOLUTION.value
    return WorkflowPhase.TEACH.value


@validate_call(validate_return=True)
def resolve_state_type(state: dict[str, Any]) -> str:
    raw_state_type = str(state.get("state_type", "")).lower().replace("-", "_").replace(" ", "_")
    if raw_state_type in REMOVED_STATE_TYPES:
        return WorkflowStateType.EXPLAIN.value
    if raw_state_type in VALID_WORKFLOW_STATE_TYPES:
        return raw_state_type
    if raw_state_type in STATE_TYPE_ALIASES:
        return STATE_TYPE_ALIASES[raw_state_type]

    phase = str(state.get("phase", "")).lower().replace("-", "_").replace(" ", "_")
    if phase == WorkflowPhase.DOUBTS_RESOLUTION.value:
        return WorkflowStateType.DOUBTS_RESOLUTION.value

    state_id = str(state.get("state_id", "")).lower().replace("-", "_").replace(" ", "_")
    if "doubt" in state_id:
        return WorkflowStateType.DOUBTS_RESOLUTION.value
    if "example" in state_id:
        return WorkflowStateType.EXAMPLES.value
    if "predict" in state_id:
        return WorkflowStateType.STUDENT_PREDICT.value
    if "ask" in state_id or "question" in state_id:
        return WorkflowStateType.ASK_QUESTION.value
    return WorkflowStateType.EXPLAIN.value


@validate_call(validate_return=True)
def resolve_advance_trigger(state: dict[str, Any], state_type: str) -> str:
    raw_advance_trigger = str(state.get("advance_trigger", "")).lower().replace("-", "_").replace(" ", "_")
    if raw_advance_trigger in REMOVED_ADVANCE_TRIGGERS:
        return AdvanceTrigger.AUTO.value
    if raw_advance_trigger in VALID_ADVANCE_TRIGGERS:
        return raw_advance_trigger
    if raw_advance_trigger in ADVANCE_TRIGGER_ALIASES:
        return ADVANCE_TRIGGER_ALIASES[raw_advance_trigger]

    if state_type == WorkflowStateType.STUDENT_PREDICT.value:
        return AdvanceTrigger.STUDENT_SUBMITTED.value
    if state_type == WorkflowStateType.DOUBTS_RESOLUTION.value:
        return AdvanceTrigger.DOUBT_SESSION_CLOSED_OR_SKIPPED.value
    return AdvanceTrigger.AUTO.value


@validate_call(validate_return=True)
def _is_supported_workflow_state(state: dict[str, Any]) -> bool:
    raw_state_type = str(state.get("state_type", "")).lower().replace("-", "_").replace(" ", "_")
    raw_phase = str(state.get("phase", "")).lower().replace("-", "_").replace(" ", "_")
    state_id = str(state.get("state_id", "")).lower().replace("-", "_").replace(" ", "_")
    if raw_state_type in REMOVED_STATE_TYPES or raw_phase in REMOVED_PHASES:
        return False
    if "quiz" in state_id and "doubt" not in state_id:
        return False
    return True
