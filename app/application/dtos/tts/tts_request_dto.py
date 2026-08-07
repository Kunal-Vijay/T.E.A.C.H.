from __future__ import annotations

from pydantic import BaseModel, field_validator

from app.domain.enums import LanguageStyle


class TtsRequestDTO(BaseModel):
    text: str
    language_style: LanguageStyle | None = None

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        trimmed_value = value.strip()
        if trimmed_value == "":
            raise ValueError("text cannot be empty")
        return trimmed_value
