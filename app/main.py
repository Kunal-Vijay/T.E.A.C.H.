from __future__ import annotations

import app.core.logging_config  # noqa: F401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from mangum import Mangum

from app.config import settings
from app.presentation.exception_handlers import register_exception_handlers
from app.presentation.middlewares.request_log_middleware import RequestLogMiddleware
from app.presentation.routes.class_plan_routes import router as class_plan_router
from app.presentation.routes.classroom_session_routes import router as classroom_session_router
from app.presentation.routes.classroom_session_routes import workflow_router
from app.presentation.routes.doubt_session_routes import router as doubt_session_router
from app.presentation.routes.generation_routes import router as generation_router
from app.presentation.routes.pop_quiz_routes import router as pop_quiz_router
from app.presentation.routes.tts_routes import router as tts_router

app = FastAPI(title="TEACH API", description="Teacherless Education through Autonomous Cognitive Heuristics", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLogMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.include_router(class_plan_router)
app.include_router(generation_router)
app.include_router(classroom_session_router)
app.include_router(workflow_router)
app.include_router(pop_quiz_router)
app.include_router(doubt_session_router)
app.include_router(tts_router)
register_exception_handlers(app)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


handler = Mangum(app)
