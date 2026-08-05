from __future__ import annotations

from enum import StrEnum


class PlanStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class GenerationStatus(StrEnum):
    PENDING = "pending"
    GENERATING_CONTENT = "generating_content"
    GENERATING_IMAGES = "generating_images"
    COMPLETED = "completed"
    COMPLETED_WITH_WARNINGS = "completed_with_warnings"
    FAILED = "failed"


class TeachingApproach(StrEnum):
    DIRECT_INSTRUCTION = "direct_instruction"
    INQUIRY_BASED = "inquiry_based"


class WorkflowPhase(StrEnum):
    TEACH = "teach"
    POP_QUIZ = "pop_quiz"
    DOUBTS_RESOLUTION = "doubts_resolution"


class WorkflowStateType(StrEnum):
    ASK_QUESTION = "ask_question"
    STUDENT_PREDICT = "student_predict"
    EXPLAIN = "explain"
    EXAMPLES = "examples"
    POP_QUIZ = "pop_quiz"
    DOUBTS_RESOLUTION = "doubts_resolution"


class AdvanceTrigger(StrEnum):
    AUTO = "auto"
    STUDENT_SUBMITTED = "student_submitted"
    ALL_QUESTIONS_ATTEMPTED = "all_questions_attempted"
    DOUBT_SESSION_CLOSED_OR_SKIPPED = "doubt_session_closed_or_skipped"


class SlideElementType(StrEnum):
    HEADING = "heading"
    TEXT = "text"
    BULLET_LIST = "bullet_list"
    LATEX = "latex"
    IMAGE = "image"


class SlideLayout(StrEnum):
    TITLE_CONTENT = "title_content"
    FULL_IMAGE = "full_image"
    FORMULA_FOCUS = "formula_focus"


class AssetStatus(StrEnum):
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class ClassroomSessionStatus(StrEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class DoubtSessionStatus(StrEnum):
    ACTIVE = "active"
    CLOSED = "closed"
