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
    },
    "required": ["slide_id", "layout", "elements"],
}

TEACH_TURN_SCHEMA = {
    "type": "object",
    "properties": {
        "tutor_message": {"type": "string"},
        "explanation_text": {"type": "string"},
        "slides": {"type": "array", "items": SLIDE_SCHEMA},
        "taught_toc_item_ids": {"type": "array", "items": {"type": "string"}},
        "is_goal_complete": {"type": "boolean"},
    },
    "required": [
        "tutor_message",
        "explanation_text",
        "slides",
        "taught_toc_item_ids",
        "is_goal_complete",
    ],
}

DOUBT_TURN_SCHEMA = {
    "type": "object",
    "properties": {
        "tutor_message": {"type": "string"},
        "explanation_text": {"type": "string"},
        "slides": {"type": "array", "items": SLIDE_SCHEMA},
        "is_goal_complete": {"type": "boolean"},
    },
    "required": ["tutor_message", "explanation_text", "slides", "is_goal_complete"],
}

POP_QUIZ_OPTION_SCHEMA = {
    "type": "object",
    "properties": {
        "option_id": {"type": "string"},
        "text": {"type": "string"},
        "is_correct": {"type": "boolean"},
    },
    "required": ["option_id", "text", "is_correct"],
}

POP_QUIZ_TURN_SCHEMA = {
    "type": "object",
    "properties": {
        "tutor_message": {"type": "string"},
        "phase": {"type": "string", "enum": ["ask_question", "explain_attempt", "complete"]},
        "question_text": {"type": "string"},
        "options": {"type": "array", "items": POP_QUIZ_OPTION_SCHEMA},
        "selected_option_is_correct": {"type": "boolean"},
        "explanation_text": {"type": "string"},
        "slides": {"type": "array", "items": SLIDE_SCHEMA},
        "is_goal_complete": {"type": "boolean"},
        "questions_asked": {"type": "integer"},
    },
    "required": [
        "tutor_message",
        "phase",
        "explanation_text",
        "slides",
        "is_goal_complete",
        "questions_asked",
    ],
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
