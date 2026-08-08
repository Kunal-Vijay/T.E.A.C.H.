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


_EXPIRED_CREDENTIAL_MARKERS = (
    "ExpiredToken",
    "ExpiredTokenException",
    "InvalidClientTokenId",
    "UnrecognizedClientException",
    "security token included in the request is expired",
)


def _is_expired_credentials_error(error: Exception) -> bool:
    """True when a Bedrock call failed because the credentials are stale.

    Matched on the botocore error code where available, falling back to the message,
    so it does not depend on a specific botocore version.
    """
    code = ""
    response = getattr(error, "response", None)
    if isinstance(response, dict):
        code = str(response.get("Error", {}).get("Code", ""))
    haystack = f"{code} {error}"
    return any(marker.lower() in haystack.lower() for marker in _EXPIRED_CREDENTIAL_MARKERS)


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
    model_id: str | None = None,
    max_tokens: int | None = None,
) -> dict[str, Any]:
    require_bedrock_configuration()
    if not has_aws_credentials():
        logger.warning("Bedrock mock response used for operation=%s (no AWS credentials)", operation)
        return mock_response

    resolved_model = model_id.strip() if model_id is not None and model_id.strip() != "" else settings.BEDROCK_MODEL_ID
    resolved_max_tokens = max_tokens if max_tokens is not None else 8192

    request_payload = json.dumps(
        {
            "model": resolved_model,
            "operation": operation,
            "prompt": prompt,
            "response_schema": tool_schema,
            "max_tokens": resolved_max_tokens,
        },
        ensure_ascii=False,
    )
    log_external_api_request(logger, "Bedrock", operation, request_payload)
    bedrock_client = get_bedrock_runtime_client()
    try:
        response = bedrock_client.converse(
            modelId=resolved_model,
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
            inferenceConfig={"maxTokens": resolved_max_tokens},
        )
    except Exception as error:
        # has_aws_credentials() only checks that keys are PRESENT, so expired
        # temporary credentials sail past it and fail here instead of taking the
        # mock path. Treat expiry as "no usable credentials" so the app stays
        # demoable, but log loudly — this is a configuration problem, not a
        # normal offline run.
        if _is_expired_credentials_error(error):
            logger.warning(
                "AWS credentials are EXPIRED — falling back to the mock response for "
                "operation=%s. Refresh them to get real model output.",
                operation,
            )
            return mock_response
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
