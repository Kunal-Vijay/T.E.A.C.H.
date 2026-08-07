"""Verify the interruption filter, turn-detection config and feedback wiring."""

from __future__ import annotations

import sys

from dotenv import load_dotenv

load_dotenv()

import app.main  # noqa: E402
from app.config import settings  # noqa: E402
from app.infrastructure.bedrock.nova_sonic_client import is_interruption_text  # noqa: E402

CASES = [
    # The literal payload Nova Sonic sends, plus spacing variants.
    ('{"interrupted": true}', True),
    ('{ "interrupted" : true }', True),
    ('{"interrupted":true}', True),
    ('  {"interrupted": true}  ', True),
    ('{"interrupted": true, "extra": 1}', True),
    # Must NOT be filtered — these are real speech or unrelated payloads.
    ('{"interrupted": false}', False),
    ("That is an interesting thought.", False),
    ("", False),
    ("{not json", False),
    ("I was interrupted while speaking.", False),
    ('{"other": true}', False),
    ("interrupted", False),
]


def main() -> int:
    failures = [
        (text, expected, is_interruption_text(text))
        for text, expected in CASES
        if is_interruption_text(text) != expected
    ]
    print(f"interruption filter : {len(CASES) - len(failures)}/{len(CASES)} cases pass")
    for text, expected, actual in failures:
        print(f"  FAIL {text!r} expected={expected} got={actual}")

    print()
    print(f"max_tokens          = {settings.NOVA_SONIC_MAX_TOKENS}")
    print(f"temperature         = {settings.NOVA_SONIC_TEMPERATURE}")
    print(f"endpointing         = {settings.NOVA_SONIC_ENDPOINTING_SENSITIVITY}")
    print(f"viva limit          = {settings.VIVA_MAX_QUESTIONS} questions / {settings.VIVA_MAX_SECONDS}s")

    paths = {getattr(route, "path", "") for route in app.main.app.routes}
    feedback_registered = "/api/v1/understanding-check/feedback" in paths
    print(f"feedback route      = {feedback_registered}")

    # Confirm turn detection is actually in the sessionStart payload we send.
    import inspect

    from app.infrastructure.bedrock import nova_sonic_client

    source = inspect.getsource(nova_sonic_client.NovaSonicSession.start)
    has_turn_detection = "turnDetectionConfiguration" in source
    print(f"turnDetection sent  = {has_turn_detection}")

    # Prompt should now forbid explaining and cap turn length.
    from app.application.services.understanding_check_service import SOCRATIC_RULES

    checks = {
        "caps turn length": "two short sentences" in SOCRATIC_RULES,
        "caps word count": "30 spoken words" in SOCRATIC_RULES,
        "one question only": "exactly one question mark" in SOCRATIC_RULES,
        "forbids explaining": "Do not explain a concept" in SOCRATIC_RULES,
        "forbids preamble": "Do not preface your question" in SOCRATIC_RULES,
        "bans stock praise": "That's an interesting thought" in SOCRATIC_RULES,
        "shows good vs bad": "Good:" in SOCRATIC_RULES and "Bad" in SOCRATIC_RULES,
    }
    print()
    for label, ok in checks.items():
        print(f"  {'OK  ' if ok else 'MISS'} prompt {label}")

    ok = not failures and feedback_registered and has_turn_detection
    print()
    print("RESULT:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
