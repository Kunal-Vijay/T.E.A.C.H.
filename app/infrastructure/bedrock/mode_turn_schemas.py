from __future__ import annotations

SLIDE_ELEMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "element_id": {"type": "string"},
        "type": {"type": "string", "enum": ["heading", "text", "bullet_list", "latex"]},
        "content": {},
    },
    "required": ["element_id", "type", "content"],
}

SLIDE_SCHEMA = {
    "type": "object",
    "properties": {
        "slide_id": {"type": "string"},
        "layout": {"type": "string", "enum": ["title_content", "formula_focus", "full_image"]},
        "elements": {"type": "array", "items": SLIDE_ELEMENT_SCHEMA},
        "explanation_text": {
            "type": "string",
            "description": "Exact spoken narration for this slide only",
        },
    },
    "required": ["slide_id", "layout", "elements", "explanation_text"],
}

TEACH_TURN_SCHEMA = {
    "type": "object",
    "properties": {
        "tutor_message": {"type": "string"},
        "slides": {"type": "array", "items": SLIDE_SCHEMA},
        "taught_toc_item_ids": {"type": "array", "items": {"type": "string"}},
        "is_goal_complete": {"type": "boolean"},
    },
    "required": [
        "tutor_message",
        "slides",
        "taught_toc_item_ids",
        "is_goal_complete",
    ],
}

DOUBT_TURN_SCHEMA = {
    "type": "object",
    "properties": {
        "tutor_message": {"type": "string"},
        "slides": {"type": "array", "items": SLIDE_SCHEMA},
        "is_goal_complete": {"type": "boolean"},
    },
    "required": ["tutor_message", "slides", "is_goal_complete"],
}

VIVA_TURN_SCHEMA = {
    "type": "object",
    "properties": {
        "tutor_message": {"type": "string"},
        "question": {"type": "string"},
        "evaluation_of_previous": {"type": "string"},
        "next_action": {"type": "string", "enum": ["ask", "advance", "complete"]},
        "weak_toc_item_ids": {"type": "array", "items": {"type": "string"}},
        "insight_summary": {"type": "string"},
        "is_goal_complete": {"type": "boolean"},
        "questions_asked": {"type": "integer"},
    },
    "required": [
        "tutor_message",
        "question",
        "evaluation_of_previous",
        "next_action",
        "weak_toc_item_ids",
        "insight_summary",
        "is_goal_complete",
        "questions_asked",
    ],
}
