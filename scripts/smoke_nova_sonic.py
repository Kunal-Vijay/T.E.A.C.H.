"""Headless smoke test for the Nova Sonic understanding-check prototype.

Proves the full path works without needing a browser or a microphone:
builds the enriched Socratic prompt from a real generation+topic in the DB,
opens a Nova Sonic stream, speaks a student answer into it using macOS `say`,
and prints the transcript plus how much audio came back.

Usage:
    ./venv312/bin/python scripts/smoke_nova_sonic.py
    ./venv312/bin/python scripts/smoke_nova_sonic.py --say "I think force equals mass times velocity"
    ./venv312/bin/python scripts/smoke_nova_sonic.py --print-prompt
"""

from __future__ import annotations

import argparse
import asyncio
import contextlib
import logging
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
from uuid import UUID

from dotenv import load_dotenv

load_dotenv()

from app.application.services.understanding_check_service import UnderstandingCheckService  # noqa: E402
from app.core.database import SessionFactory  # noqa: E402
from app.infrastructure.bedrock.nova_sonic_client import (  # noqa: E402
    INPUT_SAMPLE_RATE,
    NovaSonicSession,
    classify_event,
)
from app.infrastructure.unit_of_work import UnitOfWork  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logging.getLogger("smithy_core").setLevel(logging.WARNING)
logging.getLogger("smithy_http").setLevel(logging.WARNING)
logging.getLogger("awscrt").setLevel(logging.WARNING)

DEFAULT_UTTERANCE = (
    "I think motion just means something is moving. "
    "If a thing changes place then it is in motion, and that is all there is to it."
)
CHUNK_FRAMES = 1024


def pick_topic() -> tuple[UUID, UUID, str]:
    """Find a completed generation that actually has slides, and its first topic."""
    from sqlalchemy import text

    session = SessionFactory()
    try:
        row = session.execute(
            text(
                """
                SELECT s.generation_id, s.topic_id, t.title, COUNT(*) AS slide_count
                FROM live_class_slides s
                JOIN class_plan_topics t ON t.id = s.topic_id
                JOIN live_class_generations g ON g.id = s.generation_id
                WHERE g.status IN ('COMPLETED', 'completed',
                                   'COMPLETED_WITH_WARNINGS', 'completed_with_warnings')
                GROUP BY s.generation_id, s.topic_id
                ORDER BY slide_count DESC
                LIMIT 1
                """
            )
        ).first()
    finally:
        session.close()

    if row is None:
        print("FAIL: no completed generation with slides found in teach.db.")
        print("      Load the sample data first: sqlite3 teach.db < teach_dump.sql")
        sys.exit(1)

    generation_id, topic_id, title, slide_count = row
    print(f"Using topic '{title}' ({slide_count} slides)")
    return UUID(str(generation_id)), UUID(str(topic_id)), str(title)


def synthesize_pcm16(utterance: str) -> bytes:
    """Render speech to 16 kHz mono PCM16 using the macOS `say` command."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        wav_path = Path(tmp_dir) / "utterance.wav"
        result = subprocess.run(
            [
                "say",
                "-o",
                str(wav_path),
                "--data-format=LEI16@16000",
                "--channels=1",
                utterance,
            ],
            capture_output=True,
        )
        if result.returncode != 0:
            print(f"FAIL: `say` exited {result.returncode}: {result.stderr.decode(errors='replace')}")
            sys.exit(1)
        with wave.open(str(wav_path)) as wav_file:
            assert wav_file.getframerate() == INPUT_SAMPLE_RATE, wav_file.getframerate()
            assert wav_file.getnchannels() == 1
            assert wav_file.getsampwidth() == 2
            return wav_file.readframes(wav_file.getnframes())


async def run(utterance: str, show_prompt: bool) -> int:
    generation_id, topic_id, _title = pick_topic()

    unit_of_work = UnitOfWork(SessionFactory())
    prompt_dto = UnderstandingCheckService(unit_of_work).build_prompt(generation_id, topic_id)

    print()
    print(f"prompt chars   = {prompt_dto.character_count}")
    print(f"sources        = {prompt_dto.source_counts}")
    print(f"model / voice  = {prompt_dto.model_id} / {prompt_dto.voice_id}")
    print(f"aws configured = {prompt_dto.nova_sonic_configured}")
    if show_prompt:
        print("\n----- SYSTEM PROMPT -----")
        print(prompt_dto.system_prompt)
        print("----- END PROMPT -----")
    print()

    pcm = synthesize_pcm16(utterance)
    print(f'Student says (synthetic): "{utterance}"')
    print(f"audio bytes    = {len(pcm)} ({len(pcm) / 2 / INPUT_SAMPLE_RATE:.1f}s)")
    print()

    session = NovaSonicSession(system_prompt=prompt_dto.system_prompt)
    transcript: list[tuple[str, str]] = []
    audio_bytes_out = 0
    event_counts: dict[str, int] = {}
    current_role = "UNKNOWN"

    await session.start()

    async def pump_events() -> None:
        nonlocal audio_bytes_out, current_role
        async for payload in session.events():
            name, body = classify_event(payload)
            event_counts[name] = event_counts.get(name, 0) + 1
            if name == "contentStart":
                current_role = body.get("role", current_role)
            elif name == "textOutput":
                content = body.get("content", "").strip()
                if content:
                    transcript.append((current_role, content))
                    print(f"  [{current_role}] {content}")
            elif name == "audioOutput":
                audio_bytes_out += len(body.get("content", "")) * 3 // 4
            elif name in {"modelStreamErrorException", "validationException", "internalServerException"}:
                print(f"  !! {name}: {body}")

    pump_task = asyncio.create_task(pump_events())

    # Feed the utterance in realtime-sized chunks, then a tail of silence so the
    # model's turn detection fires and it starts responding.
    chunk_size = CHUNK_FRAMES * 2
    for offset in range(0, len(pcm), chunk_size):
        await session.send_audio_chunk(pcm[offset : offset + chunk_size])
        await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)

    silence = b"\x00" * chunk_size
    for _ in range(40):
        await session.send_audio_chunk(silence)
        await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)

    # Wait until the tutor's audio stops arriving for a couple of seconds, so we
    # capture the whole turn rather than truncating it.
    print("\nWaiting for the tutor to finish responding...")
    last_seen = -1
    idle_ticks = 0
    for _ in range(200):
        await asyncio.sleep(0.2)
        if audio_bytes_out != last_seen:
            last_seen = audio_bytes_out
            idle_ticks = 0
            continue
        idle_ticks += 1
        if audio_bytes_out > 0 and idle_ticks >= 12:
            break

    await session.close()
    pump_task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await pump_task

    print()
    print(f"event counts   = {event_counts}")
    print(f"audio returned = {audio_bytes_out} bytes (~{audio_bytes_out / 2 / 24000:.1f}s of speech)")
    print()

    assistant_turns = [text for role, text in transcript if role == "ASSISTANT"]
    user_turns = [text for role, text in transcript if role == "USER"]

    print("=" * 60)
    if user_turns:
        print(f"PASS  speech recognised: \"{' '.join(user_turns)[:120]}\"")
    else:
        print("WARN  no USER transcript came back (turn detection may not have fired)")
    if assistant_turns:
        print(f"PASS  tutor replied with {len(assistant_turns)} text event(s)")
    else:
        print("FAIL  tutor produced no text output")
    if audio_bytes_out > 0:
        print("PASS  tutor returned synthesized audio")
    else:
        print("FAIL  tutor returned no audio")
    print("=" * 60)

    return 0 if (assistant_turns and audio_bytes_out > 0) else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--say", default=DEFAULT_UTTERANCE, help="what the fake student says")
    parser.add_argument("--print-prompt", action="store_true", help="dump the full system prompt")
    args = parser.parse_args()
    return asyncio.run(run(args.say, args.print_prompt))


if __name__ == "__main__":
    sys.exit(main())
