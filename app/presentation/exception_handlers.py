from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.log_utils import log_api_error, truncate_for_log
from app.domain.exceptions import DomainException

logger = logging.getLogger(__name__)


def register_exception_handlers(application: FastAPI) -> None:
    @application.exception_handler(DomainException)
    async def handle_domain_exception(request: Request, exception: DomainException) -> JSONResponse:
        status_code = 400
        if exception.__class__.__name__.endswith("NotFoundException"):
            status_code = 404
        log_api_error(
            logger,
            request.method,
            request.url.path,
            exception,
            query_params=str(request.query_params),
        )
        return JSONResponse(status_code=status_code, content={"detail": str(exception)})

    @application.exception_handler(RequestValidationError)
    async def handle_request_validation_error(
        request: Request,
        exception: RequestValidationError,
    ) -> JSONResponse:
        logger.error(
            "API request validation error method=%s path=%s query=%s errors=%s",
            request.method,
            request.url.path,
            str(request.query_params),
            truncate_for_log(str(exception.errors())),
        )
        return JSONResponse(status_code=422, content={"detail": exception.errors()})

    @application.exception_handler(StarletteHTTPException)
    async def handle_http_exception(request: Request, exception: StarletteHTTPException) -> JSONResponse:
        if exception.status_code >= 500:
            log_api_error(
                logger,
                request.method,
                request.url.path,
                exception,
                query_params=str(request.query_params),
            )
        else:
            logger.warning(
                "API http error method=%s path=%s status=%s detail=%s",
                request.method,
                request.url.path,
                exception.status_code,
                exception.detail,
            )
        return JSONResponse(status_code=exception.status_code, content={"detail": exception.detail})

    @application.exception_handler(Exception)
    async def handle_unexpected_exception(request: Request, exception: Exception) -> JSONResponse:
        log_api_error(
            logger,
            request.method,
            request.url.path,
            exception,
            query_params=str(request.query_params),
        )
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
