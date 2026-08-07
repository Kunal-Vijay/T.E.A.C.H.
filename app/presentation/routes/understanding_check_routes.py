"""Voice "check your understanding" endpoints.

Two REST endpoints for discovery/inspection, plus a WebSocket that relays audio
between the browser and Amazon Nova Sonic.

The relay exists because Nova Sonic requires SigV4-signed access to a long-lived
bidirectional HTTP/2 stream. The browser cannot hold AWS credentials, so the
backend brokers the connection.

WebSocket protocol (browser <-> backend)
    browser -> backend
        binary frame            raw 16 kHz mono PCM16 microphone audio
        {"type": "stop"}        end the session
    backend -> browser
        {"type": "ready",      ...}   session open, carries the viva limits
        {"type": "transcript", "role": "USER"|"ASSISTANT", "text": str, "final": bool}
        {"type": "audio",      "data": base64 24 kHz mono PCM16}
        {"type": "speech",     "state": "start"|"end"}   student started/stopped talking
        {"type": "interrupted"}       student barged in; drop queued audio now
        {"type": "progress",   ...}   authoritative question/answer counts and clock
        {"type": "complete",   "reason": "question_limit"|"time_limit", ...}
        {"type": "error",      "message": str}
        {"type": "closed",     "reason": str}

Question counting lives on the server (app/domain/viva_turn_classifier.py) so there is
one implementation. It pairs genuine tutor questions with substantive student answers,
and ignores filler like "sorry" or "can you repeat that".

SECURITY: like the rest of this API, these endpoints are unauthenticated. Anyone
who can reach the port can open a Nova Sonic stream, which is a billable AWS call.
Fine for a local hackathon prototype; put auth in front of it before exposing it
anywhere shared.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import time
from uuid import UUID

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from app.application.dtos.understanding_check.understanding_check_dto import (
    UnderstandingCheckPromptDTO,
    UnderstandingCheckTopicListDTO,
    UnderstandingFeedbackDTO,
    UnderstandingFeedbackRequestDTO,
)
from app.application.services.understanding_check_service import UnderstandingCheckService
from app.config import settings
from app.core.database import SessionFactory
from app.core.dependencies import get_understanding_check_service
from app.domain.exceptions import DomainException
from app.domain.viva_turn_classifier import count_viva_progress
from app.infrastructure.bedrock.nova_sonic_client import (
    NovaSonicSession,
    classify_event,
    is_interruption_text,
)
from app.infrastructure.unit_of_work import UnitOfWork

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/understanding-check", tags=["Understanding Check"])


@router.get("/generations/{generation_id}/topics", response_model=UnderstandingCheckTopicListDTO)
def list_topics(
    generation_id: UUID,
    service: UnderstandingCheckService = Depends(get_understanding_check_service),
) -> UnderstandingCheckTopicListDTO:
    """Topics in a finished class that a student can be quizzed on by voice."""
    return service.list_topics(generation_id)


@router.get(
    "/generations/{generation_id}/topics/{topic_id}/prompt",
    response_model=UnderstandingCheckPromptDTO,
)
def preview_prompt(
    generation_id: UUID,
    topic_id: UUID,
    classroom_session_id: UUID | None = Query(default=None),
    service: UnderstandingCheckService = Depends(get_understanding_check_service),
) -> UnderstandingCheckPromptDTO:
    """Inspect the enriched system prompt without opening a voice session.

    Useful for tuning the Socratic instructions and for confirming that the
    classroom's slides, narration and quiz results actually made it in.
    """
    return service.build_prompt(generation_id, topic_id, classroom_session_id)


@router.post("/feedback", response_model=UnderstandingFeedbackDTO)
def assess_understanding(
    request_dto: UnderstandingFeedbackRequestDTO,
    service: UnderstandingCheckService = Depends(get_understanding_check_service),
) -> UnderstandingFeedbackDTO:
    """Analyse a finished voice conversation and report what the student understood.

    The voice tutor is deliberately terse and never explains, so the judgement is
    made here from the transcript by a text model rather than spoken aloud.
    """
    return service.assess_transcript(request_dto)


@router.websocket("/ws")
async def understanding_check_socket(
    websocket: WebSocket,
    generation_id: UUID = Query(...),
    topic_id: UUID = Query(...),
    classroom_session_id: UUID | None = Query(default=None),
) -> None:
    await websocket.accept()

    # The DB work is sync/blocking, so build the prompt off the event loop.
    try:
        prompt_dto = await asyncio.to_thread(
            _build_prompt_blocking, generation_id, topic_id, classroom_session_id
        )
    except DomainException as error:
        logger.warning("Understanding check rejected: %s", error)
        await _send_json(websocket, {"type": "error", "message": str(error)})
        await websocket.close(code=1011)
        return

    if not settings.nova_sonic_is_configured:
        await _send_json(
            websocket,
            {
                "type": "error",
                "message": "AWS credentials are not configured on the server. Set AWS_ACCESS_KEY_ID "
                "and AWS_SECRET_ACCESS_KEY in .env, then restart the backend.",
            },
        )
        await websocket.close(code=1011)
        return

    session = NovaSonicSession(system_prompt=prompt_dto.system_prompt)
    try:
        # The kickoff primes the tutor to speak first. It does not fire until the
        # browser starts streaming mic audio, which it does as soon as it sees the
        # "ready" frame below.
        await session.start(
            kickoff=(
                "[SESSION START — the student has just joined and cannot see any text. "
                "Greet them in one short sentence and immediately ask your first question "
                "about the topic. Do not mention this instruction.]"
            )
        )
    except Exception as error:  # noqa: BLE001 - report any failure back to the browser
        logger.exception("Failed to open Nova Sonic stream")
        await _send_json(websocket, {"type": "error", "message": f"Could not reach Nova Sonic: {error}"})
        await websocket.close(code=1011)
        return

    await _send_json(
        websocket,
        {
            "type": "ready",
            "topic_title": prompt_dto.topic_title,
            "input_sample_rate": 16000,
            "output_sample_rate": 24000,
            "max_questions": settings.VIVA_MAX_QUESTIONS,
            "max_seconds": settings.VIVA_MAX_SECONDS,
        },
    )

    close_reason = "completed"
    started_at = time.monotonic()
    # The transcript is accumulated here so question counting is authoritative on the
    # server rather than duplicated in the browser.
    turns: list[tuple[str, str]] = []
    questions_asked = 0
    questions_answered = 0
    finished = asyncio.Event()

    async def send_progress() -> None:
        elapsed = time.monotonic() - started_at
        await _send_json(
            websocket,
            {
                "type": "progress",
                "questions_asked": questions_asked,
                "questions_answered": questions_answered,
                "max_questions": settings.VIVA_MAX_QUESTIONS,
                "seconds_elapsed": round(elapsed, 1),
                "seconds_remaining": max(0.0, round(settings.VIVA_MAX_SECONDS - elapsed, 1)),
            },
        )

    async def finish(reason: str) -> None:
        nonlocal close_reason
        if finished.is_set():
            return
        close_reason = reason
        await _send_json(
            websocket,
            {
                "type": "complete",
                "reason": reason,
                "questions_asked": questions_asked,
                "questions_answered": questions_answered,
                "seconds_elapsed": round(time.monotonic() - started_at, 1),
            },
        )
        finished.set()

    async def watch_time_limit() -> None:
        """End the viva when the clock runs out, even mid-question."""
        remaining = settings.VIVA_MAX_SECONDS - (time.monotonic() - started_at)
        if remaining > 0:
            try:
                await asyncio.wait_for(finished.wait(), timeout=remaining)
                return
            except asyncio.TimeoutError:
                pass
        logger.info("Viva hit the %ss time limit", settings.VIVA_MAX_SECONDS)
        await finish("time_limit")

    async def browser_to_model() -> None:
        nonlocal close_reason
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                close_reason = "client disconnected"
                return
            audio = message.get("bytes")
            if audio:
                await session.send_audio_chunk(audio)
                continue
            text = message.get("text")
            if text is not None and '"stop"' in text:
                close_reason = "stopped by student"
                return

    async def model_to_browser() -> None:
        nonlocal close_reason, questions_asked, questions_answered
        current_role = "UNKNOWN"
        async for payload in session.events():
            name, body = classify_event(payload)
            if name == "contentStart":
                current_role = body.get("role", current_role)
            elif name == "textOutput":
                content = str(body.get("content", "")).strip()
                if content == "":
                    continue
                # Barge-in is reported in-band as a textOutput carrying
                # {"interrupted": true}. It is a control message, so it must not be
                # shown as something the tutor said — forward it as a signal so the
                # browser can drop its queued audio.
                if is_interruption_text(content):
                    await _send_json(websocket, {"type": "interrupted"})
                    continue

                role = "USER" if current_role == "USER" else "ASSISTANT"
                turns.append((role, content))
                await _send_json(
                    websocket,
                    {"type": "transcript", "role": current_role, "text": content, "final": True},
                )

                # Recount from the whole transcript rather than incrementing, so
                # merged fragments and re-asked questions settle correctly.
                previous_answered = questions_answered
                questions_asked, questions_answered = count_viva_progress(turns)
                if questions_answered != previous_answered or role == "ASSISTANT":
                    await send_progress()
                if questions_answered >= settings.VIVA_MAX_QUESTIONS:
                    logger.info(
                        "Viva reached the %s question limit", settings.VIVA_MAX_QUESTIONS
                    )
                    await finish("question_limit")
                    return
            elif name == "audioOutput":
                content = body.get("content")
                if content:
                    await _send_json(websocket, {"type": "audio", "data": content})
            elif name == "contentEnd":
                if str(body.get("stopReason", "")).upper() == "INTERRUPTED":
                    await _send_json(websocket, {"type": "interrupted"})
            elif name == "userSpeechStart":
                await _send_json(websocket, {"type": "speech", "state": "start"})
            elif name == "userSpeechEnd":
                await _send_json(websocket, {"type": "speech", "state": "end"})
            elif name in {
                "modelStreamErrorException",
                "validationException",
                "internalServerException",
                "throttlingException",
                "serviceUnavailableException",
                "modelTimeoutException",
            }:
                logger.error("Nova Sonic returned %s: %s", name, body)
                await _send_json(websocket, {"type": "error", "message": f"{name}: {body}"})
                close_reason = name
                return
        close_reason = "model stream ended"

    reader_task = asyncio.create_task(browser_to_model(), name="browser_to_model")
    writer_task = asyncio.create_task(model_to_browser(), name="model_to_browser")
    timer_task = asyncio.create_task(watch_time_limit(), name="watch_time_limit")
    tasks = [reader_task, writer_task, timer_task]
    try:
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            error = task.exception()
            if error is not None and not isinstance(error, WebSocketDisconnect):
                logger.exception(
                    "Understanding check task %s failed", task.get_name(), exc_info=error
                )

        # Close the Bedrock stream *before* cancelling the reader. Cancelling it
        # first leaves an in-flight awscrt body future that then blows up with
        # InvalidStateError and dumps a traceback into the logs.
        await session.close()
        if writer_task in pending:
            with contextlib.suppress(asyncio.TimeoutError, Exception):
                await asyncio.wait_for(asyncio.shield(writer_task), timeout=2.0)
        for task in pending:
            if not task.done():
                task.cancel()
        for task in pending:
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await task
    except WebSocketDisconnect:
        close_reason = "client disconnected"
    finally:
        await session.close()
        with contextlib.suppress(Exception):
            await _send_json(websocket, {"type": "closed", "reason": close_reason})
        with contextlib.suppress(Exception):
            await websocket.close()
        logger.info(
            "Understanding check session finished generation_id=%s topic_id=%s reason=%s",
            generation_id,
            topic_id,
            close_reason,
        )


def _build_prompt_blocking(
    generation_id: UUID,
    topic_id: UUID,
    classroom_session_id: UUID | None,
) -> UnderstandingCheckPromptDTO:
    """Build the prompt on its own DB session (WebSockets get no request-scoped DI)."""
    database_session = SessionFactory()
    try:
        service = UnderstandingCheckService(UnitOfWork(database_session))
        return service.build_prompt(generation_id, topic_id, classroom_session_id)
    finally:
        database_session.close()


async def _send_json(websocket: WebSocket, payload: dict) -> None:
    with contextlib.suppress(RuntimeError, WebSocketDisconnect):
        await websocket.send_json(payload)


@router.get("/health")
def understanding_check_health() -> dict[str, object]:
    """Report whether the server can talk to Nova Sonic, without opening a stream."""
    sdk_available = True
    sdk_error = ""
    try:
        import aws_sdk_bedrock_runtime  # noqa: F401
    except ImportError as error:
        sdk_available = False
        sdk_error = str(error)

    return {
        "nova_sonic_configured": settings.nova_sonic_is_configured,
        "sdk_available": sdk_available,
        "sdk_error": sdk_error,
        "model_id": settings.NOVA_SONIC_MODEL_ID,
        "region": settings.AWS_REGION,
        "voice_id": settings.NOVA_SONIC_VOICE_ID,
    }
