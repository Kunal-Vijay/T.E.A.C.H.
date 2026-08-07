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


class TopicStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class LearningMode(StrEnum):
    TEACH = "teach"
    DOUBT = "doubt"
    POP_QUIZ = "pop_quiz"
    VIVA = "viva"


class LearningSessionStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class GoalStatus(StrEnum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class SessionTurnRole(StrEnum):
    STUDENT = "student"
    TUTOR = "tutor"
    SYSTEM = "system"


class InputChannel(StrEnum):
    CHAT = "chat"
    SPEECH = "speech"


class VivaAdvanceReason(StrEnum):
    PASS = "pass"
    SILENCE = "silence"
    DONT_KNOW = "dont_know"


class VivaNextAction(StrEnum):
    ASK = "ask"
    ADVANCE = "advance"
    COMPLETE = "complete"


class AcademicLevel(StrEnum):
    CLASS_6 = "class_6"
    CLASS_7 = "class_7"
    CLASS_8 = "class_8"
    CLASS_9 = "class_9"
    CLASS_10 = "class_10"
    CLASS_11 = "class_11"
    CLASS_12 = "class_12"
    UNDERGRADUATE = "undergraduate"


class ExamTarget(StrEnum):
    SCHOOL_EXAM = "school_exam"
    BOARD_EXAM = "board_exam"
    JEE_MAIN = "jee_main"
    JEE_ADVANCED = "jee_advanced"
    NEET = "neet"
    OLYMPIAD = "olympiad"
    CONCEPT_LEARNING = "concept_learning"


class PriorKnowledge(StrEnum):
    NONE = "none"
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    STRONG = "strong"
    EXPERT = "expert"


class LearningStyle(StrEnum):
    EXAMPLES_FIRST = "examples_first"
    THEORY_FIRST = "theory_first"
    ANALOGY_DRIVEN = "analogy_driven"
    VISUAL_FIRST = "visual_first"
    PROBLEM_SOLVING = "problem_solving"
    STORY_BASED = "story_based"
    REAL_WORLD_APPLICATIONS = "real_world_applications"
    STEP_BY_STEP = "step_by_step"


class ExplanationDepth(StrEnum):
    QUICK_OVERVIEW = "quick_overview"
    STANDARD = "standard"
    DETAILED = "detailed"
    DEEP_CONCEPTUAL = "deep_conceptual"
    EXAM_ORIENTED = "exam_oriented"


class Pace(StrEnum):
    SLOW = "slow"
    MODERATE = "moderate"
    FAST = "fast"
    ADAPTIVE = "adaptive"


class LanguageStyle(StrEnum):
    SIMPLE_ENGLISH = "simple_english"
    FORMAL_ENGLISH = "formal_english"
    HINGLISH = "hinglish"
    HINDI = "hindi"
    BILINGUAL = "bilingual"


class InteractionMode(StrEnum):
    LECTURE = "lecture"
    GUIDED = "guided"
    SOCRATIC = "socratic"
    INTERACTIVE = "interactive"
    QUIZ_FOCUSED = "quiz_focused"
    DISCUSSION = "discussion"


class PracticePreference(StrEnum):
    MOSTLY_EXPLANATIONS = "mostly_explanations"
    BALANCED = "balanced"
    PRACTICE_HEAVY = "practice_heavy"
    CHALLENGE_MODE = "challenge_mode"


class PrimaryGoal(StrEnum):
    PASS_EXAM = "pass_exam"
    SCORE_HIGH = "score_high"
    CONCEPT_MASTERY = "concept_mastery"
    REVISION = "revision"
    PROBLEM_SOLVING = "problem_solving"
    COMPETITIVE_EXAM = "competitive_exam"
