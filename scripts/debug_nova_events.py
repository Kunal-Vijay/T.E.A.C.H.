"""Dump raw Nova Sonic events to see exactly what contentStart payloads carry.

This is a diagnostic: it opens a stream, sends silence, and prints every event
with its full body rather than just the classified name.

Usage:
    PYTHONPATH=. ./venv312/bin/python scripts/debug_nova_events.py
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import sys
import time

from dotenv import load_dotenv

load_dotenv()

from app.infrastructure.bedrock.nova_sonic_client import NovaSonicSession  # noqa: E402
from app.infrastructure.bedrock.viva_voice_prompt import (  # noqa: E402
    build_voice_viva_kickoff,
    build_voice_viva_system_prompt,
)
from app.core.database import SessionFactory  # noqa: E402
from app.domain.enums import TopicStatus  # noqa: E402
from app.domain.student_params import default_student_params  # noqa: E402
from app.infrastructure.unit_of_work import UnitOfWork  # noqa: E402

CHUNK_FRAMES = 1024
SILENCE = b"\x00" * (CHUNK_FRAMES * 2)


async def main() -> int:
    database_session = SessionFactory()
    unit_of_work = UnitOfWork(database_session)
    try:
        with unit_of_work:
            topics, _ = unit_of_work.topic_repository.find_all(
                subject=None, status=TopicStatus.PUBLISHED, offset=0, limit=5
            )
        topic = next((t for t in topics if t.toc_items), None)
        if topic is None:
            print("no published topic")
            return 1
    finally:
        database_session.close()

    prompt = build_voice_viva_system_prompt(topic, default_student_params(), [])
    kickoff = build_voice_viva_kickoff()
    session = NovaSonicSession(system_prompt=prompt)
    await session.start(kickoff=kickoff)

    event_count = 0
    started = time.monotonic()

    async def pump() -> None:
        nonlocal event_count
        async for payload in session.events():
            event_count += 1
            event = payload.get("event", {})
            name = next(iter(event)) if event else "?"
            body = event.get(name, {})

            elapsed = f"t+{time.monotonic() - started:.2f}s"

            if name == "contentStart":
                print(f"  {elapsed} contentStart role={body.get('role')} "
                      f"additionalModelFields={body.get('additionalModelFields')!r}")
            elif name == "textOutput":
                content = str(body.get("content", ""))[:80]
                print(f"  {elapsed} textOutput [{content}]")
            elif name in ("audioOutput", "usageEvent"):
                pass  # too noisy
            else:
                print(f"  {elapsed} {name} {json.dumps(body)[:120]}")

    pump_task = asyncio.create_task(pump())

    # Stream silence for ~12s then stop.
    deadline = time.monotonic() + 12
    while time.monotonic() < deadline:
        await session.send_audio_chunk(SILENCE)
        await asyncio.sleep(CHUNK_FRAMES / 16000)

    await session.close()
    pump_task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await pump_task

    print(f"\ntotal events: {event_count}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
