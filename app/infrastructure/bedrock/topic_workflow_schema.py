from __future__ import annotations

import json
import uuid
from typing import Any
from uuid import UUID

from pydantic import validate_call

from app.domain.entities import WorkflowStateEntity
from app.domain.enums import TeachingApproach, WorkflowStateType
from app.domain.exceptions import ValidationException
from app.domain.workflow_state_normalizer import normalize_workflow_definition

VALID_TEACHING_APPROACH_VALUES = {
    TeachingApproach.DIRECT_INSTRUCTION.value,
    TeachingApproach.INQUIRY_BASED.value,
}

SLIDE_ELEMENT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["element_id", "type"],
    "properties": {
        "element_id": {"type": "string"},
        "type": {
            "type": "string",
            "enum": ["heading", "text", "bullet_list", "latex", "image"],
        },
        "content": {
            "type": "string",
            "description": "Text content. For bullet_list, return a JSON array string.",
        },
        "generation_prompt": {"type": "string"},
        "asset_url": {"type": "string"},
    },
}

SLIDE_EXPLANATION_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["duration_seconds", "explanation_text"],
    "properties": {
        "duration_seconds": {"type": "integer"},
        "explanation_text": {
            "type": "string",
            "description": (
                "Exact spoken script the AI teacher reads aloud to students. "
                "Use direct address (e.g. 'Let's push this chair...'). "
                "Do not write stage directions, facilitator notes, or phrases like "
                "'Begin with this slide' or 'Allow 2-3 students to share'."
            ),
        },
    },
}

SLIDE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": [
        "slide_id",
        "workflow_state_id",
        "layout",
        "duration_seconds",
        "elements",
        "explanation",
    ],
    "properties": {
        "slide_id": {"type": "string"},
        "workflow_state_id": {"type": "string"},
        "layout": {
            "type": "string",
            "enum": ["title_content", "full_image", "formula_focus"],
        },
        "duration_seconds": {"type": "integer"},
        "elements": {
            "type": "array",
            "items": SLIDE_ELEMENT_SCHEMA,
        },
        "explanation": SLIDE_EXPLANATION_SCHEMA,
    },
}

WORKFLOW_STATE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["state_id", "phase", "state_type", "order", "label", "advance_trigger"],
    "properties": {
        "state_id": {"type": "string"},
        "phase": {
            "type": "string",
            "enum": ["teach", "doubts_resolution"],
        },
        "state_type": {
            "type": "string",
            "enum": [
                "ask_question",
                "student_predict",
                "explain",
                "examples",
                "doubts_resolution",
            ],
        },
        "order": {"type": "integer"},
        "label": {"type": "string"},
        "advance_trigger": {
            "type": "string",
            "enum": [
                "auto",
                "student_submitted",
                "doubt_session_closed_or_skipped",
            ],
        },
        "slide_ids": {
            "type": "array",
            "items": {"type": "string"},
        },
        "requires_student_input": {"type": "boolean"},
        "student_input_type": {"type": "string"},
    },
}

TOPIC_WORKFLOW_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["teaching_approach", "approach_rationale", "workflow", "slides"],
    "properties": {
        "teaching_approach": {
            "type": "string",
            "enum": ["direct_instruction", "inquiry_based"],
        },
        "approach_rationale": {"type": "string"},
        "workflow": {
            "type": "object",
            "required": ["states"],
            "properties": {
                "states": {
                    "type": "array",
                    "items": WORKFLOW_STATE_SCHEMA,
                },
            },
        },
        "slides": {
            "type": "array",
            "items": SLIDE_SCHEMA,
        },
    },
}

REQUIRED_SLIDE_FIELDS = (
    "slide_id",
    "workflow_state_id",
    "layout",
    "duration_seconds",
    "elements",
    "explanation",
)
REQUIRED_WORKFLOW_STATE_FIELDS = (
    "state_id",
    "phase",
    "state_type",
    "order",
    "label",
    "advance_trigger",
)
REQUIRED_EXPLANATION_FIELDS = ("duration_seconds", "explanation_text")


@validate_call(validate_return=True)
def normalize_topic_workflow_response(generated_topic: dict[str, Any]) -> dict[str, Any]:
    teaching_approach_value, approach_rationale_value = _resolve_teaching_approach_fields(
        generated_topic.get("teaching_approach"),
        generated_topic.get("approach_rationale"),
    )
    normalized_topic = dict(generated_topic)
    normalized_topic["teaching_approach"] = teaching_approach_value
    normalized_topic["approach_rationale"] = approach_rationale_value
    validate_topic_workflow_structure(normalized_topic)
    normalized_topic = _normalize_identifier_references(normalized_topic)
    normalized_topic = _normalize_slide_element_content_fields(normalized_topic)
    normalized_topic = _normalize_workflow_states(generated_topic=normalized_topic)
    _validate_workflow_entities(normalized_topic)
    return normalized_topic


@validate_call(validate_return=False)
def validate_topic_workflow_structure(generated_topic: dict[str, Any]) -> None:
    workflow = generated_topic.get("workflow")
    if not isinstance(workflow, dict):
        raise ValidationException("LLM response missing workflow object")

    states = workflow.get("states")
    if not isinstance(states, list) or len(states) == 0:
        raise ValidationException("LLM response must include at least one workflow state")

    for state_index, state in enumerate(states, start=1):
        if not isinstance(state, dict):
            raise ValidationException(f"Workflow state {state_index} must be an object")
        _validate_required_fields(state, REQUIRED_WORKFLOW_STATE_FIELDS, f"Workflow state {state_index}")

    slides = generated_topic.get("slides")
    if not isinstance(slides, list) or len(slides) == 0:
        raise ValidationException("LLM response must include at least one slide")

    for slide_index, slide in enumerate(slides, start=1):
        if not isinstance(slide, dict):
            raise ValidationException(f"Slide {slide_index} must be an object")
        _validate_required_fields(slide, REQUIRED_SLIDE_FIELDS, f"Slide {slide_index}")
        elements = slide.get("elements")
        if not isinstance(elements, list) or len(elements) == 0:
            raise ValidationException(f"Slide {slide_index} must include at least one element")
        explanation = slide.get("explanation")
        if not isinstance(explanation, dict):
            raise ValidationException(f"Slide {slide_index} must include an explanation object")
        _validate_required_fields(explanation, REQUIRED_EXPLANATION_FIELDS, f"Slide {slide_index} explanation")

@validate_call(validate_return=False)
def _validate_required_fields(payload: dict[str, Any], required_fields: tuple[str, ...], label: str) -> None:
    missing_fields = [
        field_name
        for field_name in required_fields
        if field_name not in payload or payload[field_name] is None or payload[field_name] == ""
    ]
    if len(missing_fields) > 0:
        missing_field_list = ", ".join(missing_fields)
        raise ValidationException(f"{label} is missing required fields: {missing_field_list}")


@validate_call(validate_return=True)
def _normalize_identifier_references(generated_topic: dict[str, Any]) -> dict[str, Any]:
    normalized_topic = dict(generated_topic)
    slide_identifier_map: dict[str, str] = {}

    normalized_slides: list[dict[str, Any]] = []
    for slide in normalized_topic.get("slides", []):
        normalized_slide = dict(slide)
        original_slide_id = str(normalized_slide["slide_id"])
        if original_slide_id not in slide_identifier_map:
            slide_identifier_map[original_slide_id] = _ensure_uuid(original_slide_id)
        normalized_slide["slide_id"] = slide_identifier_map[original_slide_id]
        normalized_slides.append(normalized_slide)
    normalized_topic["slides"] = normalized_slides
    if "pop_quiz_questions" in normalized_topic:
        del normalized_topic["pop_quiz_questions"]

    workflow = normalized_topic.get("workflow")
    if isinstance(workflow, dict):
        normalized_workflow = dict(workflow)
        normalized_states: list[dict[str, Any]] = []
        for state in workflow.get("states", []):
            normalized_state = dict(state)
            slide_ids = normalized_state.get("slide_ids")
            if isinstance(slide_ids, list):
                normalized_state["slide_ids"] = [
                    slide_identifier_map.get(str(slide_id), _ensure_uuid(str(slide_id)))
                    for slide_id in slide_ids
                ]
            if "quiz_question_ids" in normalized_state:
                del normalized_state["quiz_question_ids"]
            normalized_states.append(normalized_state)
        normalized_workflow["states"] = normalized_states
        normalized_topic["workflow"] = normalized_workflow

    return normalized_topic


@validate_call(validate_return=True)
def _normalize_slide_element_content_fields(generated_topic: dict[str, Any]) -> dict[str, Any]:
    normalized_topic = dict(generated_topic)
    normalized_slides: list[dict[str, Any]] = []
    for slide in normalized_topic.get("slides", []):
        normalized_slide = dict(slide)
        normalized_elements = [
            _normalize_slide_element_content(element)
            for element in normalized_slide.get("elements", [])
            if isinstance(element, dict)
        ]
        normalized_slide["elements"] = normalized_elements
        normalized_slides.append(normalized_slide)
    normalized_topic["slides"] = normalized_slides
    return normalized_topic


@validate_call(validate_return=True)
def _normalize_slide_element_content(element: dict[str, Any]) -> dict[str, Any]:
    normalized_element = dict(element)
    element_type = normalized_element.get("type")
    content = normalized_element.get("content")
    if element_type != "bullet_list" or not isinstance(content, str):
        return normalized_element

    stripped_content = content.strip()
    if stripped_content == "":
        return normalized_element

    if stripped_content.startswith("["):
        try:
            parsed_content = json.loads(stripped_content)
            if isinstance(parsed_content, list):
                normalized_element["content"] = [str(item) for item in parsed_content]
                return normalized_element
        except json.JSONDecodeError:
            return normalized_element

    normalized_element["content"] = [
        line.strip()
        for line in stripped_content.split("\n")
        if line.strip() != ""
    ]
    return normalized_element


@validate_call(validate_return=True)
def _ensure_uuid(identifier: str) -> str:
    try:
        return str(UUID(identifier))
    except ValueError:
        return str(uuid.uuid4())


@validate_call(validate_return=True)
def _normalize_workflow_states(generated_topic: dict[str, Any]) -> dict[str, Any]:
    normalized_topic = dict(generated_topic)
    workflow = normalized_topic.get("workflow")
    if not isinstance(workflow, dict):
        return normalized_topic
    normalized_topic["workflow"] = normalize_workflow_definition(workflow)
    return _sync_slide_workflow_state_ids(normalized_topic)


@validate_call(validate_return=False)
def _validate_workflow_entities(generated_topic: dict[str, Any]) -> None:
    workflow = generated_topic.get("workflow")
    if not isinstance(workflow, dict):
        raise ValidationException("LLM response missing workflow object")

    for state_index, state in enumerate(workflow.get("states", []), start=1):
        if not isinstance(state, dict):
            raise ValidationException(f"Workflow state {state_index} must be an object")
        try:
            WorkflowStateEntity.model_validate(state)
        except Exception as error:
            raise ValidationException(f"Workflow state {state_index} is invalid: {error}") from error


@validate_call(validate_return=True)
def _sync_slide_workflow_state_ids(generated_topic: dict[str, Any]) -> dict[str, Any]:
    workflow = generated_topic.get("workflow")
    if not isinstance(workflow, dict):
        return generated_topic

    states = [state for state in workflow.get("states", []) if isinstance(state, dict)]
    if len(states) == 0:
        return generated_topic

    state_ids = {str(state["state_id"]) for state in states}
    slide_id_to_state_id: dict[str, str] = {}
    for state in states:
        slide_ids = state.get("slide_ids")
        if not isinstance(slide_ids, list):
            continue
        for slide_id in slide_ids:
            slide_id_to_state_id[str(slide_id)] = str(state["state_id"])

    default_state_id = next(
        (str(state["state_id"]) for state in states if state.get("state_type") == WorkflowStateType.EXPLAIN.value),
        str(states[0]["state_id"]),
    )

    normalized_slides: list[dict[str, Any]] = []
    for slide in generated_topic.get("slides", []):
        if not isinstance(slide, dict):
            continue
        normalized_slide = dict(slide)
        workflow_state_id = str(normalized_slide.get("workflow_state_id", ""))
        slide_id = str(normalized_slide.get("slide_id", ""))
        if workflow_state_id not in state_ids:
            if slide_id in slide_id_to_state_id:
                normalized_slide["workflow_state_id"] = slide_id_to_state_id[slide_id]
            else:
                normalized_slide["workflow_state_id"] = default_state_id
        normalized_slides.append(normalized_slide)

    normalized_topic = dict(generated_topic)
    normalized_topic["slides"] = normalized_slides
    return normalized_topic


@validate_call(validate_return=True)
def _resolve_teaching_approach_fields(
    teaching_approach_raw: object,
    approach_rationale_raw: object,
) -> tuple[str, str]:
    approach_text = teaching_approach_raw.strip() if isinstance(teaching_approach_raw, str) else ""
    rationale_text = approach_rationale_raw.strip() if isinstance(approach_rationale_raw, str) else ""

    if approach_text in VALID_TEACHING_APPROACH_VALUES:
        return approach_text, rationale_text

    if rationale_text in VALID_TEACHING_APPROACH_VALUES:
        return rationale_text, approach_text if approach_text != "" else rationale_text

    normalized_approach = approach_text.lower().replace("-", "_").replace(" ", "_")
    if normalized_approach in VALID_TEACHING_APPROACH_VALUES:
        return normalized_approach, rationale_text

    if len(approach_text) > 50:
        return _infer_teaching_approach(approach_text), approach_text

    if "inquiry" in normalized_approach:
        return TeachingApproach.INQUIRY_BASED.value, rationale_text if rationale_text != "" else approach_text

    if approach_text != "":
        return TeachingApproach.DIRECT_INSTRUCTION.value, approach_text if rationale_text == "" else rationale_text

    raise ValidationException(
        "LLM returned an invalid teaching_approach. Expected direct_instruction or inquiry_based."
    )


@validate_call(validate_return=True)
def _infer_teaching_approach(description: str) -> str:
    description_lower = description.lower()
    inquiry_keywords = ["inquiry", "interactive", "prediction", "student-led", "explore", "discover"]
    if any(keyword in description_lower for keyword in inquiry_keywords):
        return TeachingApproach.INQUIRY_BASED.value
    return TeachingApproach.DIRECT_INSTRUCTION.value
