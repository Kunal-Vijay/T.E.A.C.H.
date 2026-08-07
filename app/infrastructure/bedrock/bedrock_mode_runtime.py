from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import validate_call

from app.config import settings
from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.exceptions import ValidationException
from app.infrastructure.bedrock.bedrock_runtime_client import (
    extract_tool_use_input,
    get_bedrock_runtime_client,
    has_aws_credentials,
)

logger = logging.getLogger(__name__)


@validate_call(validate_return=True)
def require_bedrock_configuration() -> None:
    if settings.BEDROCK_MODEL_ID.strip() == "":
        raise ValidationException("BEDROCK_MODEL_ID is required")
    if settings.BEDROCK_REGION.strip() == "":
        raise ValidationException("BEDROCK_REGION is required")
    return None


@validate_call(validate_return=True)
def invoke_structured_tool(
    operation: str,
    prompt: str,
    tool_name: str,
    tool_description: str,
    tool_schema: dict[str, Any],
    mock_response: dict[str, Any],
) -> dict[str, Any]:
    require_bedrock_configuration()
    if not has_aws_credentials():
        logger.warning("Bedrock mock response used for operation=%s (no AWS credentials)", operation)
        return mock_response

    request_payload = json.dumps(
        {
            "model": settings.BEDROCK_MODEL_ID,
            "operation": operation,
            "prompt": prompt,
            "response_schema": tool_schema,
        },
        ensure_ascii=False,
    )
    log_external_api_request(logger, "Bedrock", operation, request_payload)
    bedrock_client = get_bedrock_runtime_client()
    try:
        response = bedrock_client.converse(
            modelId=settings.BEDROCK_MODEL_ID,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            toolConfig={
                "tools": [
                    {
                        "toolSpec": {
                            "name": tool_name,
                            "description": tool_description,
                            "inputSchema": {"json": tool_schema},
                        }
                    }
                ],
                "toolChoice": {"tool": {"name": tool_name}},
            },
            inferenceConfig={"maxTokens": 8192},
        )
    except Exception as error:
        log_external_api_error(logger, "Bedrock", operation, error, request_payload=request_payload)
        raise ValidationException(f"Bedrock {operation} failed: {error}") from error

    tool_input = extract_tool_use_input(response)
    if len(tool_input) == 0:
        empty_response_error = ValidationException(f"Bedrock returned empty response for {operation}")
        log_external_api_error(
            logger,
            "Bedrock",
            operation,
            empty_response_error,
            request_payload=request_payload,
        )
        raise empty_response_error

    log_external_api_response(logger, "Bedrock", operation, json.dumps(tool_input, ensure_ascii=False))
    return tool_input
