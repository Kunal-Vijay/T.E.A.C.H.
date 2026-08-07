from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class UnderstandingCheckTopicDTO(BaseModel):
    """A topic that a student can be quizzed on by voice."""

    topic_id: UUID
    title: str
    order: int
    slide_count: int
    quiz_question_count: int
    teaching_approach: str | None = None


class UnderstandingCheckTopicListDTO(BaseModel):
    generation_id: UUID
    class_plan_id: UUID
    class_title: str
    subject: str
    grade: str
    topics: list[UnderstandingCheckTopicDTO] = Field(default_factory=list)


class UnderstandingCheckPromptDTO(BaseModel):
    """Preview of the enriched system prompt handed to Nova Sonic.

    Exposed over REST so the prompt can be inspected and tuned without opening
    a voice session.
    """

    generation_id: UUID
    topic_id: UUID
    topic_title: str
    system_prompt: str
    character_count: int
    opening_line: str
    voice_id: str
    model_id: str
    nova_sonic_configured: bool
    source_counts: dict[str, int] = Field(default_factory=dict)


class TranscriptTurnDTO(BaseModel):
    """One turn of the voice conversation, as captured by the browser."""

    role: str = Field(description="USER or ASSISTANT")
    text: str


class UnderstandingFeedbackRequestDTO(BaseModel):
    generation_id: UUID
    topic_id: UUID
    classroom_session_id: UUID | None = None
    transcript: list[TranscriptTurnDTO] = Field(default_factory=list)
    seconds_elapsed: float | None = None


class RubricScoreDTO(BaseModel):
    """One scored dimension of the student's understanding."""

    key: str
    label: str
    score: int = Field(ge=0, le=5)
    max_score: int = 5
    comment: str = Field(default="", description="One line justifying the score.")


class UnderstandingFeedbackDTO(BaseModel):
    """Written assessment of a finished voice session."""

    topic_title: str
    grasp_level: str = Field(description="solid | partial | shaky")
    headline: str = Field(description="One-sentence verdict for the student.")
    rubric: list[RubricScoreDTO] = Field(default_factory=list)
    overall_score: int = Field(default=0, ge=0, le=100, description="Percentage across the rubric.")
    understood_well: list[str] = Field(default_factory=list)
    needs_work: list[str] = Field(default_factory=list)
    misconceptions: list[str] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list)
    questions_asked: int = 0
    questions_answered: int = 0
    student_turns_analysed: int = 0
    model_used: str = ""
