from __future__ import annotations

from typing import Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "sqlite:///./teach.db"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    S3_BUCKET: str = "ai-tutor-assets-dev"
    STAGE: str = "dev"
    REGION: str = "ap-south-1"
    LOG_LEVEL: str = "INFO"
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    LIVE_CLASS_CONTENT_GENERATION_QUEUE_URL: str = ""
    LIVE_CLASS_IMAGE_GENERATION_QUEUE_URL: str = ""
    SYNC_GENERATION: bool = True

    @model_validator(mode="after")
    def validate_settings(self) -> Self:
        return self


settings = Settings()
