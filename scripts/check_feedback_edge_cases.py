"""Edge cases for the assessment endpoint.

Chiefly: a student who only ever said "sorry" must be refused, not graded.
Requires the backend to be running.
"""

from __future__ import annotations

import sys

import httpx

BASE_URL = "http://localhost:8000"


def discover_topic() -> tuple[str, str]:
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
                        return generation["generation_id"], topic["topic_id"]
    print("FAIL: no completed generation with slides found")
    sys.exit(1)


CASES: list[tuple[str, list[dict], int]] = [
    (
        "only filler — must be refused",
        [
            {"role": "ASSISTANT", "text": "Can you explain what force is?"},
            {"role": "USER", "text": "sorry"},
            {"role": "USER", "text": "what?"},
            {"role": "USER", "text": "can you repeat that"},
            {"role": "USER", "text": "um"},
        ],
        400,
    ),
    (
        "empty transcript — must be refused",
        [],
        400,
    ),
    (
        "tutor only, student silent — must be refused",
        [{"role": "ASSISTANT", "text": "Can you explain what force is?"}],
        400,
    ),
    (
        "one short but real answer — must be accepted",
        [
            {"role": "ASSISTANT", "text": "Can you explain what force is?"},
            {"role": "USER", "text": "A push or a pull between two objects."},
        ],
        200,
    ),
    (
        "filler then a real answer — must be accepted",
        [
            {"role": "ASSISTANT", "text": "Can you explain what force is?"},
            {"role": "USER", "text": "sorry"},
            {"role": "USER", "text": "can you repeat that"},
            {"role": "ASSISTANT", "text": "Sure. What is force?"},
            {"role": "USER", "text": "It is a push or a pull."},
        ],
        200,
    ),
]


def main() -> int:
    generation_id, topic_id = discover_topic()
    failures = 0

    with httpx.Client(base_url=BASE_URL, timeout=90) as client:
        for label, transcript, expected_status in CASES:
            response = client.post(
                "/api/v1/understanding-check/feedback",
                json={
                    "generation_id": generation_id,
                    "topic_id": topic_id,
                    "transcript": transcript,
                },
            )
            ok = response.status_code == expected_status
            print(f"{'PASS' if ok else 'FAIL'}  [{response.status_code}] {label}")
            if not ok:
                failures += 1
                print(f"      expected {expected_status}, body: {response.text[:200]}")
            elif response.status_code == 400:
                detail = response.json().get("detail", "")
                print(f'      refused with: "{detail}"')
            elif response.status_code == 200:
                data = response.json()
                print(
                    f"      graded: {data['overall_score']}% "
                    f"({data['questions_answered']}/{data['questions_asked']} answered)"
                )

    print()
    print("RESULT:", "PASS" if failures == 0 else f"FAIL ({failures} case(s))")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
