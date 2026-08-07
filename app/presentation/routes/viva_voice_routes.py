"""Spoken viva over Amazon Nova Sonic.

The other learning modes take a turn at a time over REST: the browser posts text,
an LLM returns the next tutor message. A speech-to-speech viva cannot work that way
— Nova Sonic keeps one long-lived bidirectional stream and handles turn-taking
itself. So this adds a WebSocket alongside the REST routes.

The relay exists because Nova Sonic needs SigV4-signed access to that stream and the
browser cannot hold AWS credentials, so the backend brokers it.

WebSocket protocol (browser <-> backend)
    browser -> backend
        binary frame            raw 16 kHz mono PCM16 microphone audio
        {"type": "stop"}        end the viva early
    backend -> browser
        {"type": "ready",      ...}   stream open, carries the viva limits
        {"type": "transcript", "role": "USER"|"ASSISTANT", "text": str}
        {"type": "audio",      "data": base64 24 kHz mono PCM16}
        {"type": "speech",     "state": "start"|"end"}   student started/stopped talking
        {"type": "interrupted"}       student barged in; drop queued audio now
        {"type": "progress",   ...}   authoritative question/answer counts and clock
        {"type": "complete",   "reason": "question_limit"|"time_limit"|..., ...}
        {"type": "error",      "message": str}
        {"type": "closed",     "reason": str}

Question counting is done here, not in the browser, using
app/domain/viva_turn_classifier.py. It pairs genuine examiner questions with
substantive student answers and ignores filler like "sorry" or "can you repeat that".

SECURITY: like the rest of this API these endpoints are unauthenticated, and opening
one starts a billable Bedrock stream. Put auth in front of it before exposing the
service anywhere shared.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import time
from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.application.dtos.learning_session.learning_session_dto import VoiceVivaAssessmentDTO
from app.application.services.learning_session_service import LearningSessionService
from app.config import settings
from app.core.database import SessionFactory
from app.core.dependencies import get_learning_session_service
from app.domain.exceptions import DomainException
from app.domain.viva_turn_classifier import count_viva_progress
from app.infrastructure.bedrock.nova_sonic_client import (
    NovaSonicSession,
    classify_event,
    is_interruption_text,
)
from app.infrastructure.repositories.learning_session_repository import LearningSessionRepository
from app.infrastructure.repositories.student_profile_repository import StudentProfileRepository
from app.infrastructure.repositories.topic_repository import TopicRepository
from app.infrastructure.unit_of_work import UnitOfWork

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/learning-sessions", tags=["Viva Voice"])


@router.get("/voice/health")
def voice_health() -> dict[str, object]:
    """Report whether the server can run a voice viva, without opening a stream."""
    sdk_available = True
    sdk_error = ""
    try:
        import aws_sdk_bedrock_runtime  # noqa: F401
    except ImportError as error:
        sdk_available = False
        sdk_error = str(error)

    credentials_available = False
    try:
        from app.infrastructure.bedrock.bedrock_runtime_client import has_aws_credentials

        credentials_available = has_aws_credentials()
    except Exception as error:  # noqa: BLE001 - reported, not raised
        sdk_error = sdk_error or str(error)

    return {
        "voice_viva_available": sdk_available and credentials_available,
        "sdk_available": sdk_available,
        "credentials_available": credentials_available,
        "sdk_error": sdk_error,
        "max_questions": settings.VIVA_MAX_QUESTIONS,
        "max_seconds": settings.VIVA_MAX_SECONDS,
    }


@router.post("/{session_id}/viva/voice/complete", response_model=VoiceVivaAssessmentDTO)
def complete_voice_viva(
    session_id: UUID,
    service: LearningSessionService = Depends(get_learning_session_service),
) -> VoiceVivaAssessmentDTO:
    """Re-read a finished voice viva's stored assessment.

    Grading happens inside the WebSocket when the viva ends. This is the reload path
    so a student who refreshes still sees their result.
    """
    return service.get_stored_voice_viva_assessment(session_id)


@router.websocket("/{session_id}/viva/voice")
async def viva_voice_socket(session_id: UUID, websocket: WebSocket) -> None:
    await websocket.accept()

    # DB access is sync, so keep it off the event loop.
    try:
        prompt_dto = await asyncio.to_thread(_build_prompt_blocking, session_id)
    except DomainException as error:
        logger.warning("Voice viva rejected for session %s: %s", session_id, error)
        await _send_json(websocket, {"type": "error", "message": str(error)})
        await websocket.close(code=1011)
        return

    session = NovaSonicSession(system_prompt=prompt_dto.system_prompt)
    try:
        # The kickoff makes the examiner speak first. It does not fire until the
        # browser starts streaming mic audio, which it does on seeing "ready".
        await session.start(kickoff=prompt_dto.kickoff)
    except Exception as error:  # noqa: BLE001 - surface any failure to the browser
        logger.exception("Failed to open the Nova Sonic stream")
        await _send_json(
            websocket,
            {"type": "error", "message": f"Could not start the voice examiner: {error}"},
        )
        await websocket.close(code=1011)
        return

    await _send_json(
        websocket,
        {
            "type": "ready",
            "topic_title": prompt_dto.topic_title,
            "input_sample_rate": 16000,
            "output_sample_rate": 24000,
            "max_questions": prompt_dto.max_questions,
            "max_seconds": prompt_dto.max_seconds,
        },
    )

    close_reason = "completed"
    started_at = time.monotonic()
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
                "max_questions": prompt_dto.max_questions,
                "seconds_elapsed": round(elapsed, 1),
                "seconds_remaining": max(0.0, round(prompt_dto.max_seconds - elapsed, 1)),
            },
        )

    async def finish(reason: str) -> None:
        nonlocal close_reason
        if finished.is_set():
            return
        close_reason = reason
        finished.set()

    async def watch_time_limit() -> None:
        """End the viva when the clock runs out, even mid-question."""
        remaining = prompt_dto.max_seconds - (time.monotonic() - started_at)
        if remaining > 0:
            with contextlib.suppress(asyncio.TimeoutError):
                await asyncio.wait_for(finished.wait(), timeout=remaining)
                return
        logger.info("Voice viva hit the %ss limit session_id=%s", prompt_dto.max_seconds, session_id)
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
        # Nova Sonic emits text twice for each utterance:
        #   1. SPECULATIVE — arrives when TTS starts, same content as final
        #   2. Audio chunks — the spoken version
        #   3. FINAL — arrives after audio finishes, same content repeated
        # We forward SPECULATIVE (so text appears immediately when audio plays) and
        # SKIP FINAL (since it's a duplicate). The audio block in between has
        # additionalModelFields=None and is_final_text stays False.
        last_forwarded_text: str = ""
        async for payload in session.events():
            name, body = classify_event(payload)
            if name == "contentStart":
                current_role = body.get("role", current_role)
            elif name == "contentEnd":
                if str(body.get("stopReason", "")).upper() == "INTERRUPTED":
                    await _send_json(websocket, {"type": "interrupted"})
            elif name == "textOutput":
                content = str(body.get("content", "")).strip()
                if content == "":
                    continue
                if is_interruption_text(content):
                    await _send_json(websocket, {"type": "interrupted"})
                    continue

                # Deduplicate: Nova Sonic sends the same text as SPECULATIVE then
                # FINAL. Forward the first occurrence and skip the repeat.
                if content == last_forwarded_text:
                    continue
                last_forwarded_text = content

                role = "USER" if current_role == "USER" else "ASSISTANT"
                turns.append((role, content))
                await _send_json(
                    websocket,
                    {"type": "transcript", "role": role, "text": content},
                )

                # Recount over the whole transcript rather than incrementing, so
                # merged fragments and re-asked questions settle correctly.
                previous_answered = questions_answered
                questions_asked, questions_answered = count_viva_progress(turns)
                if questions_answered != previous_answered or role == "ASSISTANT":
                    await send_progress()
                if questions_answered >= prompt_dto.max_questions:
                    logger.info(
                        "Voice viva reached the %s question limit session_id=%s",
                        prompt_dto.max_questions,
                        session_id,
                    )
                    await finish("question_limit")
                    return
            elif name == "audioOutput":
                content = body.get("content")
                if content:
                    await _send_json(websocket, {"type": "audio", "data": content})
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
                await finish(name)
                return
        await finish("model stream ended")

    reader_task = asyncio.create_task(browser_to_model(), name="viva_browser_to_model")
    writer_task = asyncio.create_task(model_to_browser(), name="viva_model_to_browser")
    timer_task = asyncio.create_task(watch_time_limit(), name="viva_time_limit")
    tasks = [reader_task, writer_task, timer_task]

    try:
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            error = task.exception()
            if error is not None and not isinstance(error, WebSocketDisconnect):
                logger.exception("Voice viva task %s failed", task.get_name(), exc_info=error)

        # Close the Bedrock stream before cancelling the reader: cancelling first
        # leaves an in-flight awscrt body future that raises InvalidStateError and
        # dumps a traceback into the logs.
        await session.close()
        if writer_task in pending:
            with contextlib.suppress(Exception):
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

    # Tell the UI we are now grading so it can show a loader. The assessment model
    # call takes 5–30 seconds; without this the student stares at nothing.
    with contextlib.suppress(Exception):
        await _send_json(
            websocket,
            {
                "type": "grading",
                "reason": close_reason,
                "questions_asked": questions_asked,
                "questions_answered": questions_answered,
            },
        )

    # Persist and grade. Done after the stream is torn down so a slow model call
    # cannot hold the audio channel open.
    elapsed = round(time.monotonic() - started_at, 1)
    assessment_payload: dict | None = None
    assessment_error: str | None = None
    try:
        await asyncio.to_thread(_record_turns_blocking, session_id, turns)
        assessment = await asyncio.to_thread(
            _complete_blocking, session_id, turns, questions_asked, questions_answered
        )
        assessment_payload = assessment.model_dump(mode="json")
    except DomainException as error:
        assessment_error = str(error)
        logger.info("Voice viva not graded session_id=%s: %s", session_id, error)
    except Exception as error:  # noqa: BLE001 - never let grading break the close
        assessment_error = "Could not mark your viva. Please try again."
        logger.exception("Voice viva grading failed session_id=%s", session_id)
        logger.debug("grading error detail: %s", error)

    with contextlib.suppress(Exception):
        await _send_json(
            websocket,
            {
                "type": "complete",
                "reason": close_reason,
                "questions_asked": questions_asked,
                "questions_answered": questions_answered,
                "seconds_elapsed": elapsed,
                "assessment": assessment_payload,
                "assessment_error": assessment_error,
            },
        )
    with contextlib.suppress(Exception):
        await _send_json(websocket, {"type": "closed", "reason": close_reason})
    with contextlib.suppress(Exception):
        await websocket.close()

    logger.info(
        "Voice viva finished session_id=%s reason=%s asked=%s answered=%s elapsed=%ss",
        session_id,
        close_reason,
        questions_asked,
        questions_answered,
        elapsed,
    )


def _service_for_websocket() -> tuple[LearningSessionService, object]:
    """Build a service with its own DB session.

    WebSocket handlers get no request-scoped dependency injection, so the normal
    Depends() graph is not available here.
    """
    from app.infrastructure.bedrock.bedrock_interactive_doubt_client import (
        BedrockInteractiveDoubtClient,
    )
    from app.infrastructure.bedrock.bedrock_teach_client import BedrockTeachClient
    from app.infrastructure.bedrock.bedrock_viva_client import BedrockVivaClient

    database_session = SessionFactory()
    unit_of_work = UnitOfWork(database_session)
    service = LearningSessionService(
        unit_of_work=unit_of_work,
        teach_client=BedrockTeachClient(),
        doubt_client=BedrockInteractiveDoubtClient(),
        viva_client=BedrockVivaClient(),
    )
    return service, database_session


def _build_prompt_blocking(session_id: UUID):
    service, database_session = _service_for_websocket()
    try:
        return service.build_voice_viva_prompt(session_id)
    finally:
        database_session.close()


def _record_turns_blocking(session_id: UUID, turns: list[tuple[str, str]]) -> None:
    service, database_session = _service_for_websocket()
    try:
        service.record_voice_viva_turns(session_id, turns)
    finally:
        database_session.close()


def _complete_blocking(
    session_id: UUID,
    turns: list[tuple[str, str]],
    questions_asked: int,
    questions_answered: int,
) -> VoiceVivaAssessmentDTO:
    service, database_session = _service_for_websocket()
    try:
        return service.complete_voice_viva(
            session_id, turns, questions_asked, questions_answered
        )
    finally:
        database_session.close()


async def _send_json(websocket: WebSocket, payload: dict) -> None:
    with contextlib.suppress(RuntimeError, WebSocketDisconnect):
        await websocket.send_json(payload)


# Imported for their side effects on the DI graph only; keeps linters from pruning
# repositories that UnitOfWork resolves lazily.
_ = (LearningSessionRepository, StudentProfileRepository, TopicRepository)
