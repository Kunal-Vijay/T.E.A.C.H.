from __future__ import annotations

import os
from typing import Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "sqlite:///./teach.db"
    BEDROCK_MODEL_ID: str = "us.anthropic.claude-sonnet-4-6"
    BEDROCK_REGION: str = ""
    BEDROCK_READ_TIMEOUT_SECONDS: int = 600
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
        if self.BEDROCK_REGION.strip() == "":
            default_region = os.environ.get("AWS_DEFAULT_REGION", "")
            if default_region.strip() != "":
                object.__setattr__(self, "BEDROCK_REGION", default_region)
            else:
                object.__setattr__(self, "BEDROCK_REGION", self.REGION)
        return self


settings = Settings()
