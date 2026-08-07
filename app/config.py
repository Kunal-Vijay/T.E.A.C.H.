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

    # --- Amazon Bedrock / Nova Sonic (voice understanding check) ---
    # NOTE: us-west-2 hosts amazon.nova-2-sonic-v1:0. The older amazon.nova-sonic-v1:0
    # is NOT available there — verify with scripts/check_bedrock_access.py before changing.
    AWS_REGION: str = "us-west-2"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_SESSION_TOKEN: str = ""
    NOVA_SONIC_MODEL_ID: str = "amazon.nova-2-sonic-v1:0"
    NOVA_SONIC_VOICE_ID: str = "matthew"
    # Kept deliberately low: the tutor should ask one short question per turn, not
    # lecture. Raising this is the fastest way to make it start rambling again.
    NOVA_SONIC_MAX_TOKENS: int = 320
    NOVA_SONIC_TEMPERATURE: float = 0.6
    NOVA_SONIC_TOP_P: float = 0.9
    # HIGH responds fastest but clips slow speakers; LOW waits longer, which suits a
    # student thinking out loud mid-explanation. MEDIUM is the AWS default.
    NOVA_SONIC_ENDPOINTING_SENSITIVITY: str = "LOW"
    # Viva bounds. The session ends on whichever limit is reached first, so a
    # student who answers quickly gets all 10 questions and one who rambles is
    # still done inside the time box.
    VIVA_MAX_QUESTIONS: int = 10
    VIVA_MAX_SECONDS: int = 120
    # Text model that grades the transcript afterwards. Bedrock is preferred over
    # Gemini because the AWS credentials are already configured for Nova Sonic, so
    # the assessment works with no extra setup. amazon.nova-lite-v1:0 is ON_DEMAND
    # in us-west-2 — check with scripts/list_bedrock_text_models.py before changing.
    BEDROCK_ASSESSMENT_MODEL_ID: str = "amazon.nova-lite-v1:0"
    # "bedrock" | "gemini" | "auto". auto prefers Bedrock, then Gemini, then a
    # local heuristic placeholder.
    ASSESSMENT_PROVIDER: str = "auto"

    @property
    def nova_sonic_is_configured(self) -> bool:
        return self.AWS_ACCESS_KEY_ID.strip() != "" and self.AWS_SECRET_ACCESS_KEY.strip() != ""

    @model_validator(mode="after")
    def validate_settings(self) -> Self:
        return self


settings = Settings()
