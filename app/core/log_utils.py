from __future__ import annotations

import logging
from typing import Any

MAX_LOG_BODY_LENGTH = 4000
BINARY_RESPONSE_PATH_PREFIXES = ("/api/v1/tts/speak",)
SKIP_BODY_PATHS = {"/health"}


def truncate_for_log(content: bytes | str | None) -> str:
    if content is None:
        return ""
    if isinstance(content, bytes):
        text = content.decode("utf-8", errors="replace")
    else:
        text = content
    if len(text) <= MAX_LOG_BODY_LENGTH:
        return text
    truncated_length = len(text) - MAX_LOG_BODY_LENGTH
    return f"{text[:MAX_LOG_BODY_LENGTH]}... [truncated {truncated_length} chars]"


def should_skip_body_logging(path: str) -> bool:
    return path in SKIP_BODY_PATHS


def is_binary_response(path: str, media_type: str | None) -> bool:
    if any(path.startswith(prefix) for prefix in BINARY_RESPONSE_PATH_PREFIXES):
        return True
    if media_type is not None and "audio" in media_type:
        return True
    return False


def format_binary_response_body(response_body: bytes) -> str:
    return f"[binary content {len(response_body)} bytes]"


def log_external_api_request(logger: logging.Logger, service_name: str, operation: str, request_payload: str) -> None:
    logger.info(
        "[%s] request operation=%s payload=%s",
        service_name,
        operation,
        truncate_for_log(request_payload),
    )


def log_external_api_response(logger: logging.Logger, service_name: str, operation: str, response_payload: str) -> None:
    logger.info(
        "[%s] response operation=%s payload=%s",
        service_name,
        operation,
        truncate_for_log(response_payload),
    )


def log_external_api_error(
    logger: logging.Logger,
    service_name: str,
    operation: str,
    error: Exception,
    *,
    request_payload: str | None = None,
) -> None:
    if request_payload is not None:
        logger.error(
            "[%s] error operation=%s message=%s request_payload=%s",
            service_name,
            operation,
            str(error),
            truncate_for_log(request_payload),
            exc_info=True,
        )
        return
    logger.error(
        "[%s] error operation=%s message=%s",
        service_name,
        operation,
        str(error),
        exc_info=True,
    )


def log_api_error(
    logger: logging.Logger,
    method: str,
    path: str,
    error: Exception,
    *,
    query_params: Any = None,
    request_body: str = "",
) -> None:
    logger.error(
        "API error method=%s path=%s query=%s request_body=%s error=%s",
        method,
        path,
        query_params,
        truncate_for_log(request_body),
        str(error),
        exc_info=True,
    )
