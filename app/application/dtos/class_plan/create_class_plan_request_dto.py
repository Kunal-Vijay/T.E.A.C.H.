from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class TopicInputDTO(BaseModel):
    order: int
    title: str
    duration_minutes: int
    base_material: str
    teaching_guidelines: list[str] = Field(default_factory=list)
    miscellaneous_notes: list[str] = Field(default_factory=list)

    @field_validator("base_material")
    @classmethod
    def validate_base_material(cls, value: str) -> str:
        stripped_value = value.strip()
        if len(stripped_value) < 10:
            raise ValueError("base_material must be at least 10 characters")
        return stripped_value

    @field_validator("duration_minutes")
    @classmethod
    def validate_duration(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("duration_minutes must be greater than 0")
        return value


class CreateClassPlanRequestDTO(BaseModel):
    title: str
    subject: str
    grade: str
    class_label: str
    chapter_name: str
    chapter_number: int | None = None
    target_exam: str
    language_code: str = "en-IN"
    topics: list[TopicInputDTO]
    created_by: str | None = None

    @field_validator("topics")
    @classmethod
    def validate_topics(cls, value: list[TopicInputDTO]) -> list[TopicInputDTO]:
        if len(value) == 0:
            raise ValueError("topics must contain at least one topic")
        topic_orders = [topic.order for topic in value]
        if len(topic_orders) != len(set(topic_orders)):
            raise ValueError("topic order values must be unique")
        return value


class UpdateClassPlanRequestDTO(BaseModel):
    title: str
    subject: str
    grade: str
    class_label: str
    chapter_name: str
    chapter_number: int | None = None
    target_exam: str
    language_code: str = "en-IN"
    topics: list[TopicInputDTO]

    @field_validator("topics")
    @classmethod
    def validate_topics(cls, value: list[TopicInputDTO]) -> list[TopicInputDTO]:
        if len(value) == 0:
            raise ValueError("topics must contain at least one topic")
        topic_orders = [topic.order for topic in value]
        if len(topic_orders) != len(set(topic_orders)):
            raise ValueError("topic order values must be unique")
        return value
