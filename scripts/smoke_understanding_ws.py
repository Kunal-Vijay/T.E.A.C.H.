"""Smoke test for the /api/v1/understanding-check/ws WebSocket relay.

Impersonates the browser: connects, streams synthetic 16 kHz PCM16 speech,
and reports the transcript and audio it gets back. Requires the backend to
already be running on port 8000.

Usage:
    ./venv312/bin/python scripts/smoke_understanding_ws.py
    ./venv312/bin/python scripts/smoke_understanding_ws.py --say "force is just a push"
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
WS_URL = "ws://localhost:8000/api/v1/understanding-check/ws"
INPUT_SAMPLE_RATE = 16000
CHUNK_FRAMES = 1024
DEFAULT_UTTERANCE = "Force is when you push something and it moves. That is basically what force is."


def discover_topic() -> tuple[str, str]:
    """Ask the API for a generation+topic to test against."""
    with httpx.Client(base_url=BASE_URL, timeout=30) as client:
        plans = client.get("/api/v1/class-plans", params={"page": 1, "limit": 50}).json()
        for plan in plans["items"]:
            generations = client.get(f"/api/v1/class-plans/{plan['plan_id']}/generations").json()
            for generation in generations["items"]:
                if generation["status"] not in {"completed", "completed_with_warnings"}:
                    continue
                topics = client.get(
                    f"/api/v1/understanding-check/generations/{generation['generation_id']}/topics"
                ).json()
                for topic in topics["topics"]:
                    if topic["slide_count"] > 0:
                        print(
                            f"Testing '{topic['title']}' from class '{topics['class_title']}' "
                            f"({topic['slide_count']} slides)"
                        )
                        return generation["generation_id"], topic["topic_id"]
    print("FAIL: no completed generation with slides found via the API")
    sys.exit(1)


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
    generation_id, topic_id = discover_topic()
    url = f"{WS_URL}?generation_id={generation_id}&topic_id={topic_id}"

    pcm = synthesize_pcm16(utterance)
    print(f'Student says (synthetic): "{utterance}"')
    print(f"audio in       = {len(pcm)} bytes ({len(pcm) / 2 / INPUT_SAMPLE_RATE:.1f}s)")
    print()

    ready_payload: dict = {}
    transcript: list[tuple[str, str]] = []
    audio_out_bytes = 0
    errors: list[str] = []
    message_counts: dict[str, int] = {}
    last_progress: dict = {}
    completion: dict = {}

    async with websockets.connect(url, max_size=None) as socket:

        async def receive_loop() -> None:
            nonlocal audio_out_bytes, ready_payload, last_progress, completion
            async for raw in socket:
                message = json.loads(raw)
                kind = message.get("type", "?")
                message_counts[kind] = message_counts.get(kind, 0) + 1
                if kind == "ready":
                    ready_payload = message
                    print("READY:")
                    print(f"  topic          = {message['topic_title']}")
                    print(f"  viva limits    = {message['max_questions']} questions / {message['max_seconds']}s")
                    print(f"  sample rates   = in {message['input_sample_rate']} / out {message['output_sample_rate']}")
                    # Internal details must not be leaked to the client any more.
                    leaked = [
                        key
                        for key in ("model_id", "voice_id", "prompt_character_count", "source_counts")
                        if key in message
                    ]
                    if leaked:
                        errors.append(f"ready frame still leaks internal fields: {leaked}")
                    print()
                elif kind == "transcript":
                    transcript.append((message["role"], message["text"]))
                    print(f"  [{message['role']}] {message['text']}")
                elif kind == "audio":
                    audio_out_bytes += len(base64.b64decode(message["data"]))
                elif kind == "progress":
                    last_progress = message
                    print(
                        f"  (progress: asked={message['questions_asked']} "
                        f"answered={message['questions_answered']} "
                        f"left={message['seconds_remaining']}s)"
                    )
                elif kind == "complete":
                    completion = message
                    print(f"  (COMPLETE: {message['reason']} after {message['seconds_elapsed']}s)")
                elif kind == "speech":
                    print(f"  (student speech {message['state']})")
                elif kind == "error":
                    errors.append(message["message"])
                    print(f"  !! ERROR: {message['message']}")
                elif kind == "closed":
                    print(f"  (closed: {message['reason']})")
                    return

        receive_task = asyncio.create_task(receive_loop())

        # Wait for the ready handshake before speaking.
        for _ in range(100):
            await asyncio.sleep(0.1)
            if ready_payload or errors:
                break
        if errors:
            receive_task.cancel()
            print("\nFAIL: server reported an error during setup")
            return 1
        if not ready_payload:
            receive_task.cancel()
            print("\nFAIL: never received the ready handshake")
            return 1

        chunk_size = CHUNK_FRAMES * 2
        silence = b"\x00" * chunk_size

        # Nova Sonic's turn machinery is driven by the audio stream: it will not open
        # the conversation unless frames are arriving. A real browser starts its mic
        # the moment it sees "ready", so stream silence here to match that, otherwise
        # the tutor appears to never speak first.
        print("Streaming silence, waiting for the tutor to ask the first question...")
        for _ in range(400):
            await socket.send(silence)
            await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)
            if any(role == "ASSISTANT" for role, _ in transcript) and audio_out_bytes > 0:
                break

        # Let the tutor finish its opening question before answering over it.
        opening_idle = 0
        last_audio = -1
        for _ in range(200):
            await socket.send(silence)
            await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)
            if audio_out_bytes != last_audio:
                last_audio = audio_out_bytes
                opening_idle = 0
                continue
            opening_idle += 1
            if opening_idle >= 20:
                break
        print()
        for offset in range(0, len(pcm), chunk_size):
            await socket.send(pcm[offset : offset + chunk_size])
            await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)

        silence = b"\x00" * chunk_size
        for _ in range(40):
            await socket.send(silence)
            await asyncio.sleep(CHUNK_FRAMES / INPUT_SAMPLE_RATE)

        print("\nWaiting for the tutor to finish...")
        last_seen = -1
        idle_ticks = 0
        for _ in range(200):
            await asyncio.sleep(0.2)
            if completion:
                break
            if audio_out_bytes != last_seen:
                last_seen = audio_out_bytes
                idle_ticks = 0
                continue
            idle_ticks += 1
            if audio_out_bytes > 0 and idle_ticks >= 12:
                break

        await socket.send(json.dumps({"type": "stop"}))
        await asyncio.sleep(1.0)
        receive_task.cancel()
        try:
            await receive_task
        except asyncio.CancelledError:
            pass

    assistant_turns = [text for role, text in transcript if role == "ASSISTANT"]
    user_turns = [text for role, text in transcript if role == "USER"]

    print()
    print(f"message counts = {message_counts}")
    print(f"audio out      = {audio_out_bytes} bytes (~{audio_out_bytes / 2 / 24000:.1f}s of speech)")
    print(f"last progress  = {last_progress or '(none)'}")
    print()
    print("=" * 60)
    ok = True

    # The tutor must open the conversation, before the student says anything.
    if transcript and transcript[0][0] == "ASSISTANT":
        print(f'PASS  tutor opened the viva: "{transcript[0][1]}"')
    elif assistant_turns:
        print("FAIL  the student spoke first; the kickoff did not fire")
        ok = False
    else:
        print("FAIL  no tutor text relayed")
        ok = False

    if user_turns:
        print(f"PASS  relay transcribed the student: \"{' '.join(user_turns)[:100]}\"")
    else:
        print("WARN  no USER transcript relayed")
    if audio_out_bytes > 0:
        print("PASS  relay returned playable audio")
    else:
        print("FAIL  no audio relayed")
        ok = False
    if last_progress:
        print(
            f"PASS  progress reported (asked={last_progress['questions_asked']}, "
            f"answered={last_progress['questions_answered']})"
        )
    else:
        print("WARN  no progress frame arrived")
    if errors:
        print(f"FAIL  errors reported: {errors}")
        ok = False
    print("=" * 60)
    return 0 if ok else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--say", default=DEFAULT_UTTERANCE)
    args = parser.parse_args()
    return asyncio.run(run(args.say))


if __name__ == "__main__":
    sys.exit(main())
