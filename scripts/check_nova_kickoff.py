"""Isolate whether the tutor speaks first, and how quickly.

Opens a Nova Sonic session, sends the kickoff, and sends NO audio at all. If the
kickoff works the model should start speaking on its own within a couple of seconds.

Usage:
    PYTHONPATH=. ./venv312/bin/python scripts/check_nova_kickoff.py
    PYTHONPATH=. ./venv312/bin/python scripts/check_nova_kickoff.py --order after-audio
"""

from __future__ import annotations

import argparse
import asyncio
import contextlib
import logging
import sys
import time

from dotenv import load_dotenv

load_dotenv()

from app.infrastructure.bedrock.nova_sonic_client import NovaSonicSession, classify_event  # noqa: E402

logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")

SYSTEM_PROMPT = (
    "You are an examiner running a spoken viva about Newton's laws. You speak first. "
    "Every turn is at most two short sentences and ends with exactly one question. "
    "Never explain anything. Greet the student in one sentence then ask your first question."
)
KICKOFF = (
    "[SESSION START — the student has just joined and cannot see any text. "
    "Greet them in one short sentence and immediately ask your first question "
    "about the topic. Do not mention this instruction.]"
)
WAIT_SECONDS = 25.0


async def run(kickoff_before_audio: bool, send_silence: bool) -> int:
    session = NovaSonicSession(system_prompt=SYSTEM_PROMPT)
    session.kickoff_before_audio = kickoff_before_audio  # type: ignore[attr-defined]

    label = "before opening audio" if kickoff_before_audio else "after opening audio"
    print(f"kickoff order  = {label}")

    opened_at = time.monotonic()
    await session.start(kickoff=KICKOFF)
    print(f"stream ready   = {time.monotonic() - opened_at:.2f}s")

    first_text_at: float | None = None
    first_audio_at: float | None = None
    said: list[str] = []
    audio_bytes = 0
    role = "UNKNOWN"

    async def pump() -> None:
        nonlocal first_text_at, first_audio_at, audio_bytes, role
        async for payload in session.events():
            name, body = classify_event(payload)
            if name == "contentStart":
                role = body.get("role", role)
            elif name == "textOutput":
                content = str(body.get("content", "")).strip()
                if content and not content.startswith("{"):
                    if first_text_at is None:
                        first_text_at = time.monotonic() - opened_at
                    if role == "ASSISTANT":
                        said.append(content)
                        print(f'  [{first_text_at:.2f}s ASSISTANT] "{content}"')
                    else:
                        print(f"  [{first_text_at:.2f}s {role}] {content}")
            elif name == "audioOutput":
                if first_audio_at is None:
                    first_audio_at = time.monotonic() - opened_at
                audio_bytes += len(body.get("content", "")) * 3 // 4
            elif name.endswith("Exception"):
                print(f"  !! {name}: {body}")

    pump_task = asyncio.create_task(pump())

    if send_silence:
        print(f"waiting {WAIT_SECONDS:.0f}s, streaming SILENCE (no speech)...")
    else:
        print(f"waiting {WAIT_SECONDS:.0f}s, sending NO audio at all...")

    # 1024 frames of 16-bit silence, the same chunk size the browser sends.
    silence = b"\x00" * 2048
    deadline = time.monotonic() + WAIT_SECONDS
    while time.monotonic() < deadline:
        if send_silence:
            await session.send_audio_chunk(silence)
            await asyncio.sleep(1024 / 16000)
        else:
            await asyncio.sleep(0.25)
        if audio_bytes > 0 and first_text_at is not None:
            # Give it a moment to finish the sentence, then stop.
            await asyncio.sleep(3.0)
            break

    await session.close()
    pump_task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await pump_task

    print()
    print(f"first text     = {f'{first_text_at:.2f}s' if first_text_at else 'never'}")
    print(f"first audio    = {f'{first_audio_at:.2f}s' if first_audio_at else 'never'}")
    print(f"audio bytes    = {audio_bytes}")
    print()
    if said and first_audio_at is not None and first_audio_at < 10:
        print(f'PASS  the tutor opened unprompted in {first_audio_at:.2f}s: "{said[0]}"')
        return 0
    if said:
        print(f"FAIL  the tutor spoke but took {first_text_at:.2f}s — too slow to feel like an opening")
        return 1
    print("FAIL  the tutor never spoke; the kickoff did not trigger a turn")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--order",
        choices=("before-audio", "after-audio"),
        default="before-audio",
        help="whether to send the kickoff before or after opening the audio block",
    )
    parser.add_argument(
        "--silence",
        action="store_true",
        help="stream silent audio frames, as a real browser mic would",
    )
    args = parser.parse_args()
    return asyncio.run(run(args.order == "before-audio", args.silence))


if __name__ == "__main__":
    sys.exit(main())
