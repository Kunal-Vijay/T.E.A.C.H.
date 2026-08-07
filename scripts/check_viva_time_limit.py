"""Verify the viva ends on its time limit.

Streams silence and never answers, so the only way the session can end is the clock.
Run the backend with a short VIVA_MAX_SECONDS (e.g. 25) or this will sit for the full
two minutes.

Usage:
    PYTHONPATH=. ./venv312/bin/python scripts/check_viva_time_limit.py
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import sys
import time

import httpx
import websockets

BASE_URL = "http://localhost:8000"
INPUT_SAMPLE_RATE = 16000
CHUNK_FRAMES = 1024


def start_viva_session() -> str:
    with httpx.Client(base_url=BASE_URL, timeout=60) as client:
        topics = client.get("/api/v1/topics", params={"status": "published", "limit": 20}).json()
        items = topics["items"] if isinstance(topics, dict) and "items" in topics else topics
        usable = [t for t in items if len(t.get("toc_items", [])) > 0]
        if not usable:
            print("FAIL: no published topic. Run scripts/seed_demo_topic.py")
            sys.exit(1)
        response = client.post(
            "/api/v1/learning-sessions",
            json={
                "topic_id": usable[0]["id"],
                "mode": "viva",
                "student_identifier": "time-limit-check",
            },
        )
        return response.json()["id"]


async def main_async() -> int:
    with httpx.Client(base_url=BASE_URL, timeout=30) as client:
        health = client.get("/api/v1/learning-sessions/voice/health").json()
    limit = int(health["max_seconds"])
    print(f"server time limit = {limit}s")
    if limit > 40:
        print(f"NOTE: this will take ~{limit}s. Set VIVA_MAX_SECONDS lower to speed it up.")

    session_id = start_viva_session()
    url = f"ws://localhost:8000/api/v1/learning-sessions/{session_id}/viva/voice"
    print(f"session = {session_id}")
    print("streaming silence, never answering...")
    print()

    completion: dict = {}
    progress_frames = 0
    ready = False
    started = time.monotonic()

    async with websockets.connect(url, max_size=None, open_timeout=30) as socket:

        async def receive_loop() -> None:
            nonlocal completion, progress_frames, ready
            async for raw in socket:
                message = json.loads(raw)
                kind = message.get("type")
                if kind == "ready":
                    ready = True
                elif kind == "progress":
                    progress_frames += 1
                    print(f"  t+{time.monotonic() - started:5.1f}s  left={message['seconds_remaining']}s")
                elif kind == "complete":
                    completion = message
                    print(
                        f"  t+{time.monotonic() - started:5.1f}s  COMPLETE reason="
                        f"{message['reason']} elapsed={message['seconds_elapsed']}s"
                    )
                elif kind == "closed":
                    return

        receive_task = asyncio.create_task(receive_loop())

        silence = b"\x00" * (CHUNK_FRAMES * 2)
        deadline = started + limit + 20
        while time.monotonic() < deadline:
            if completion:
                break
            with contextlib.suppress(Exception):
                await socket.send(silence)
            await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)

        for _ in range(100):
            if completion:
                break
            await asyncio.sleep(0.2)
        await asyncio.sleep(1.0)
        receive_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await receive_task

    elapsed = time.monotonic() - started
    print()
    print("=" * 60)
    ok = True
    if not ready:
        print("FAIL  never got the ready handshake")
        return 1

    if completion.get("reason") == "time_limit":
        print(f"PASS  ended on the time limit after {completion['seconds_elapsed']}s")
    else:
        print(f"FAIL  ended with reason={completion.get('reason', '(none)')}, expected time_limit")
        ok = False

    # Should fire close to the limit, not wildly early or late.
    if completion and abs(float(completion.get("seconds_elapsed", 0)) - limit) <= 8:
        print(f"PASS  fired near the {limit}s limit")
    elif completion:
        print(f"FAIL  fired at {completion['seconds_elapsed']}s, expected near {limit}s")
        ok = False

    if completion.get("questions_answered", -1) == 0:
        print("PASS  no answers counted (the student never spoke)")
    else:
        print(f"FAIL  counted {completion.get('questions_answered')} answers from silence")
        ok = False

    if completion.get("assessment") is None:
        print(f'PASS  not graded: "{completion.get("assessment_error")}"')
    else:
        print("FAIL  graded a session where nothing was answered")
        ok = False

    print(f"      wall clock {elapsed:.1f}s, {progress_frames} progress frame(s)")
    print("=" * 60)
    return 0 if ok else 1


def main() -> int:
    return asyncio.run(main_async())


if __name__ == "__main__":
    sys.exit(main())
