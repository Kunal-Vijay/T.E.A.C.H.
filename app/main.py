from __future__ import annotations

import app.core.logging_config  # noqa: F401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from mangum import Mangum

from app.config import settings
from app.presentation.exception_handlers import register_exception_handlers
from app.presentation.middlewares.request_log_middleware import RequestLogMiddleware
from app.presentation.routes.learning_session_routes import router as learning_session_router
from app.presentation.routes.student_profile_routes import router as student_profile_router
from app.presentation.routes.topic_routes import router as topic_router
from app.presentation.routes.tts_routes import router as tts_router
from app.presentation.routes.viva_voice_routes import router as viva_voice_router

app = FastAPI(
    title="TEACH API",
    description="Teacher Empowerment through Autonomous Cognitive Help",
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLogMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.include_router(topic_router)
app.include_router(student_profile_router)
app.include_router(learning_session_router)
app.include_router(viva_voice_router)
app.include_router(tts_router)
register_exception_handlers(app)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


handler = Mangum(app)
