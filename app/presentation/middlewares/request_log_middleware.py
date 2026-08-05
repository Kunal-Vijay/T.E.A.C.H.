from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.log_utils import (
    format_binary_response_body,
    is_binary_response,
    log_api_error,
    should_skip_body_logging,
    truncate_for_log,
)

logger = logging.getLogger(__name__)


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        path = request.url.path
        query_params = str(request.query_params) if len(request.query_params) > 0 else ""
        request_body_bytes = b""
        request_body_text = ""

        if not should_skip_body_logging(path) and request.method in {"POST", "PUT", "PATCH"}:
            request_body_bytes = await request.body()

            async def receive() -> dict[str, object]:
                return {"type": "http.request", "body": request_body_bytes, "more_body": False}

            request = Request(request.scope, receive)
            request_body_text = truncate_for_log(request_body_bytes)

        logger.info(
            "API request method=%s path=%s query=%s body=%s",
            request.method,
            path,
            query_params,
            request_body_text,
        )

        try:
            response = await call_next(request)
        except Exception as error:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            log_api_error(
                logger,
                request.method,
                path,
                error,
                query_params=query_params,
                request_body=request_body_text,
            )
            logger.error(
                "API failed method=%s path=%s status=500 duration_ms=%s",
                request.method,
                path,
                duration_ms,
            )
            raise

        response_body_bytes = b""
        async for chunk in response.body_iterator:
            response_body_bytes += chunk

        duration_ms = round((time.time() - start_time) * 1000, 2)
        response_media_type = response.media_type
        if is_binary_response(path, response_media_type):
            response_body_text = format_binary_response_body(response_body_bytes)
        else:
            response_body_text = truncate_for_log(response_body_bytes)

        if response.status_code >= 400:
            logger.error(
                "API response error method=%s path=%s status=%s duration_ms=%s query=%s request_body=%s response_body=%s",
                request.method,
                path,
                response.status_code,
                duration_ms,
                query_params,
                request_body_text,
                response_body_text,
            )
        else:
            logger.info(
                "API response method=%s path=%s status=%s duration_ms=%s response_body=%s",
                request.method,
                path,
                response.status_code,
                duration_ms,
                response_body_text,
            )

        return Response(
            content=response_body_bytes,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response_media_type,
            background=response.background,
        )
