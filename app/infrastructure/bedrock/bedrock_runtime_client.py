from __future__ import annotations

import os
from typing import Any

import boto3
from botocore.config import Config
from pydantic import validate_call

from app.config import settings


@validate_call(validate_return=True)
def resolve_bedrock_region() -> str:
    if settings.BEDROCK_REGION.strip() != "":
        return settings.BEDROCK_REGION
    default_region = os.environ.get("AWS_DEFAULT_REGION", "")
    if default_region.strip() != "":
        return default_region
    return settings.REGION


@validate_call(validate_return=False)
def get_bedrock_runtime_client(read_timeout_seconds: int | None = None):
    resolved_read_timeout = (
        read_timeout_seconds
        if read_timeout_seconds is not None
        else settings.BEDROCK_READ_TIMEOUT_SECONDS
    )
    boto_config = Config(
        read_timeout=resolved_read_timeout,
        connect_timeout=60,
    )
    return boto3.client(
        "bedrock-runtime",
        region_name=resolve_bedrock_region(),
        config=boto_config,
    )


@validate_call(validate_return=True)
def has_aws_credentials() -> bool:
    try:
        session = boto3.Session()
        credentials = session.get_credentials()
        return credentials is not None and credentials.access_key is not None
    except Exception:
        return False


@validate_call(validate_return=True)
def extract_converse_text(response: dict[str, Any]) -> str:
    output = response.get("output", {})
    message = output.get("message", {})
    content_blocks = message.get("content", [])
    text_parts = [
        block["text"]
        for block in content_blocks
        if isinstance(block, dict) and "text" in block
    ]
    return "".join(text_parts)


@validate_call(validate_return=True)
def extract_tool_use_input(response: dict[str, Any]) -> dict[str, Any]:
    output = response.get("output", {})
    message = output.get("message", {})
    content_blocks = message.get("content", [])
    for block in content_blocks:
        if isinstance(block, dict) and "toolUse" in block:
            tool_use = block["toolUse"]
            tool_input = tool_use.get("input")
            if isinstance(tool_input, dict):
                return tool_input
    return {}
