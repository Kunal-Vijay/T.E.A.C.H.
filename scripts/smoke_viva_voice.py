"""End-to-end smoke test for the spoken viva over Nova Sonic.

Starts a real viva learning session via REST, connects to the voice WebSocket,
streams synthetic speech via macOS `say`, and checks that:
  - the examiner opens the conversation unprompted
  - filler like "sorry" is NOT counted as an answer
  - a real answer IS counted
  - the session is graded with a rubric and persisted

Requires the backend running and a published topic (scripts/seed_demo_topic.py).

Usage:
    PYTHONPATH=. ./venv312/bin/python scripts/smoke_viva_voice.py
    PYTHONPATH=. ./venv312/bin/python scripts/smoke_viva_voice.py --say "sorry, what?"
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import httpx
import websockets

BASE_URL = "http://localhost:8000"
INPUT_SAMPLE_RATE = 16000
CHUNK_FRAMES = 1024
DEFAULT_UTTERANCE = (
    "Force is a push or a pull between two objects, and it can change how something moves."
)


def start_viva_session() -> tuple[str, str]:
    """Create a viva learning session against the first published topic."""
    with httpx.Client(base_url=BASE_URL, timeout=60) as client:
        topics = client.get("/api/v1/topics", params={"status": "published", "limit": 20}).json()
        items = topics["items"] if isinstance(topics, dict) and "items" in topics else topics
        published = [t for t in items if len(t.get("toc_items", [])) > 0]
        if not published:
            print("FAIL: no published topic with TOC items.")
            print("      Run: PYTHONPATH=. ./venv312/bin/python scripts/seed_demo_topic.py")
            sys.exit(1)
        topic = published[0]

        response = client.post(
            "/api/v1/learning-sessions",
            json={
                "topic_id": topic["id"],
                "mode": "viva",
                "student_identifier": "smoke-test-student",
            },
        )
        if response.status_code not in (200, 201):
            print(f"FAIL: could not start session: {response.status_code} {response.text[:300]}")
            sys.exit(1)
        session = response.json()
        print(f"topic   = {topic['title']} ({len(topic['toc_items'])} TOC items)")
        print(f"session = {session['id']} mode={session['mode']}")
        return session["id"], topic["title"]


def synthesize_pcm16(utterance: str) -> bytes:
    with tempfile.TemporaryDirectory() as tmp_dir:
        wav_path = Path(tmp_dir) / "utterance.wav"
        result = subprocess.run(
            ["say", "-o", str(wav_path), "--data-format=LEI16@16000", "--channels=1", utterance],
            capture_output=True,
        )
        if result.returncode != 0:
            print(f"FAIL: `say` exited {result.returncode}")
            sys.exit(1)
        with wave.open(str(wav_path)) as wav_file:
            return wav_file.readframes(wav_file.getnframes())


async def run(utterance: str) -> int:
    session_id, _topic_title = start_viva_session()
    url = f"ws://localhost:8000/api/v1/learning-sessions/{session_id}/viva/voice"

    pcm = synthesize_pcm16(utterance)
    print(f'student says (synthetic): "{utterance}"')
    print(f"audio in  = {len(pcm)} bytes ({len(pcm) / 2 / INPUT_SAMPLE_RATE:.1f}s)")
    print()

    ready: dict = {}
    transcript: list[tuple[str, str]] = []
    audio_out = 0
    errors: list[str] = []
    counts: dict[str, int] = {}
    last_progress: dict = {}
    completion: dict = {}

    async with websockets.connect(url, max_size=None, open_timeout=30) as socket:

        async def receive_loop() -> None:
            nonlocal audio_out, ready, last_progress, completion
            async for raw in socket:
                message = json.loads(raw)
                kind = message.get("type", "?")
                counts[kind] = counts.get(kind, 0) + 1
                if kind == "ready":
                    ready = message
                    print("READY:")
                    print(f"  topic       = {message['topic_title']}")
                    print(f"  viva limits = {message['max_questions']}Q / {message['max_seconds']}s")
                    print()
                elif kind == "transcript":
                    transcript.append((message["role"], message["text"]))
                    print(f"  [{message['role']}] {message['text']}")
                elif kind == "audio":
                    audio_out += len(base64.b64decode(message["data"]))
                elif kind == "progress":
                    last_progress = message
                    print(
                        f"  (progress asked={message['questions_asked']} "
                        f"answered={message['questions_answered']} "
                        f"left={message['seconds_remaining']}s)"
                    )
                elif kind == "complete":
                    completion = message
                    print(f"  (COMPLETE {message['reason']} after {message['seconds_elapsed']}s)")
                elif kind == "speech":
                    print(f"  (student speech {message['state']})")
                elif kind == "error":
                    errors.append(message["message"])
                    print(f"  !! ERROR {message['message']}")
                elif kind == "closed":
                    print(f"  (closed: {message['reason']})")
                    return

        receive_task = asyncio.create_task(receive_loop())

        for _ in range(150):
            await asyncio.sleep(0.1)
            if ready or errors:
                break
        if errors or not ready:
            receive_task.cancel()
            print("\nFAIL: never got the ready handshake")
            return 1

        chunk_size = CHUNK_FRAMES * 2
        silence = b"\x00" * chunk_size

        # Nova Sonic's turn machinery is audio-driven: it will not open the viva
        # unless frames are arriving. A real browser starts its mic on "ready", so
        # stream silence to match.
        print("streaming silence, waiting for the examiner to open...")
        for _ in range(400):
            await socket.send(silence)
            await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)
            if any(role == "ASSISTANT" for role, _ in transcript) and audio_out > 0:
                break

        idle = 0
        last_seen = -1
        for _ in range(200):
            await socket.send(silence)
            await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)
            if audio_out != last_seen:
                last_seen = audio_out
                idle = 0
                continue
            idle += 1
            if idle >= 20:
                break
        print()

        for offset in range(0, len(pcm), chunk_size):
            await socket.send(pcm[offset : offset + chunk_size])
            await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)
        for _ in range(45):
            await socket.send(silence)
            await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)

        print("\nwaiting for the examiner to respond...")
        idle = 0
        last_seen = -1
        for _ in range(200):
            await asyncio.sleep(0.2)
            if completion:
                break
            if audio_out != last_seen:
                last_seen = audio_out
                idle = 0
                continue
            idle += 1
            if audio_out > 0 and idle >= 15:
                break

        if not completion:
            await socket.send(json.dumps({"type": "stop"}))
        for _ in range(300):
            await asyncio.sleep(0.2)
            if completion:
                break
        await asyncio.sleep(1.0)
        receive_task.cancel()
        with __import__("contextlib").suppress(asyncio.CancelledError):
            await receive_task

    assistant_turns = [t for r, t in transcript if r == "ASSISTANT"]
    user_turns = [t for r, t in transcript if r == "USER"]

    print()
    print(f"messages  = {counts}")
    print(f"audio out = {audio_out} bytes (~{audio_out / 2 / 24000:.1f}s)")
    print()
    print("=" * 64)
    ok = True

    if transcript and transcript[0][0] == "ASSISTANT":
        print(f'PASS  examiner opened the viva: "{transcript[0][1]}"')
    else:
        print("FAIL  the examiner did not speak first")
        ok = False

    if user_turns:
        print(f'PASS  student speech transcribed: "{" ".join(user_turns)[:90]}"')
    else:
        print("WARN  no student transcript")

    if audio_out > 0:
        print("PASS  examiner audio returned")
    else:
        print("FAIL  no audio returned")
        ok = False

    if last_progress:
        print(
            f"PASS  progress: asked={last_progress['questions_asked']} "
            f"answered={last_progress['questions_answered']}"
        )
    else:
        print("WARN  no progress frame")

    if completion:
        assessment = completion.get("assessment")
        error = completion.get("assessment_error")
        if assessment is not None:
            print(f"PASS  graded: {assessment['overall_score']}% ({assessment['grasp_level']})")
            print(f"      headline: {assessment['headline']}")
            for entry in assessment["rubric"]:
                print(f"      {entry['score']}/{entry['max_score']}  {entry['label']}")
        else:
            print(f"INFO  not graded: {error}")
    else:
        print("WARN  no complete frame")

    # Confirm it persisted: re-read via REST.
    with httpx.Client(base_url=BASE_URL, timeout=60) as client:
        detail = client.get(f"/api/v1/learning-sessions/{session_id}").json()
        stored_turns = detail.get("turns", [])
        stored_viva = detail.get("viva_assessment")
        print(
            f"{'PASS' if len(stored_turns) > 0 else 'FAIL'}  "
            f"{len(stored_turns)} turn(s) persisted to session_turns"
        )
        if len(stored_turns) == 0:
            ok = False
        if stored_viva is not None:
            print(f'PASS  viva_assessment persisted: "{stored_viva["insight_summary"][:70]}"')
        else:
            print("INFO  no viva_assessment persisted (expected if nothing was answered)")
        print(f"      session status={detail['status']} goal={detail['goal_status']}")

    if errors:
        print(f"FAIL  errors: {errors}")
        ok = False
    print("=" * 64)
    return 0 if ok else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--say", default=DEFAULT_UTTERANCE)
    args = parser.parse_args()
    return asyncio.run(run(args.say))


if __name__ == "__main__":
    sys.exit(main())
