from __future__ import annotations

import os
from typing import Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "sqlite:///./teach.db"
    BEDROCK_MODEL_ID: str = "us.anthropic.claude-sonnet-4-6"
    # Faster model for live doubt Q&A (interactive sessions + SAGE). Falls back to
    # BEDROCK_MODEL_ID when unset. Haiku / Nova Lite are typical choices.
    BEDROCK_DOUBT_MODEL_ID: str = "amazon.nova-lite-v1:0"
    BEDROCK_DOUBT_MAX_TOKENS: int = 4096
    BEDROCK_REGION: str = ""
    BEDROCK_READ_TIMEOUT_SECONDS: int = 600

    # --- Voice viva (Amazon Nova Sonic speech-to-speech) ---
    # Deliberately a separate region from BEDROCK_REGION: Nova Sonic is only served
    # in a few regions, and BEDROCK_REGION falls back to REGION (ap-south-1) which
    # does not host it. Verify with scripts/check_bedrock_access.py before changing.
    # Read from .env so the app works however it was launched. boto3 only looks at
    # the process environment, so validate_settings() below copies these across.
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_SESSION_TOKEN: str = ""

    NOVA_SONIC_MODEL_ID: str = "amazon.nova-2-sonic-v1:0"
    NOVA_SONIC_REGION: str = "us-west-2"
    NOVA_SONIC_VOICE_ID: str = "matthew"
    # Kept low on purpose — this is the main lever on how much the examiner says per
    # turn. Raising it is the fastest way to make it start lecturing again.
    NOVA_SONIC_MAX_TOKENS: int = 320
    NOVA_SONIC_TEMPERATURE: float = 0.6
    NOVA_SONIC_TOP_P: float = 0.9
    # HIGH answers fastest but clips slow speakers; LOW waits longer, which suits a
    # student thinking mid-sentence. MEDIUM is the AWS default.
    NOVA_SONIC_ENDPOINTING_SENSITIVITY: str = "LOW"
    # Viva bounds. The session ends on whichever limit is reached first.
    VIVA_MAX_QUESTIONS: int = 10
    VIVA_MAX_SECONDS: int = 120
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
        self._export_aws_credentials_to_environment()
        return self

    def _export_aws_credentials_to_environment(self) -> None:
        """Copy AWS credentials from .env into the process environment.

        pydantic-settings loads .env into this object, but boto3 and the Nova Sonic
        streaming client only read os.environ. Without this, the app only works when
        the launcher happens to export .env itself (as scripts/start-backend.sh does
        with `set -a`), and a plain `uvicorn app.main:app` silently has no
        credentials — which surfaces to students as "voice viva unavailable".

        Anything already set in the real environment wins, so an instance role or an
        explicitly exported key is never overridden by a stale .env.
        """
        for field_name in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN"):
            value = getattr(self, field_name, "")
            if value.strip() != "" and os.environ.get(field_name, "").strip() == "":
                os.environ[field_name] = value

        # boto3 needs a region too, and BEDROCK_REGION is resolved by this point.
        if os.environ.get("AWS_DEFAULT_REGION", "").strip() == "":
            os.environ["AWS_DEFAULT_REGION"] = self.BEDROCK_REGION or self.REGION
        return None

    def resolve_doubt_model_id(self) -> str:
        if self.BEDROCK_DOUBT_MODEL_ID.strip() != "":
            return self.BEDROCK_DOUBT_MODEL_ID.strip()
        return self.BEDROCK_MODEL_ID


settings = Settings()
