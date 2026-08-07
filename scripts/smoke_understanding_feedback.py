"""Smoke test for POST /api/v1/understanding-check/feedback.

Posts a synthetic transcript containing known physics errors and checks the
assessment identifies them. Requires the backend to be running.

Usage:
    ./venv312/bin/python scripts/smoke_understanding_feedback.py
"""

from __future__ import annotations

import json
import sys

import httpx

BASE_URL = "http://localhost:8000"

# A student who is confidently wrong in two specific ways: F=mv instead of F=ma,
# and the Aristotelian "constant speed needs constant force" misconception.
TRANSCRIPT = [
    {"role": "ASSISTANT", "text": "Can you explain what force means in your own words?"},
    {"role": "USER", "text": "Force is just a push. If you push something it moves."},
    {"role": "ASSISTANT", "text": "You push a wall and it doesn't move. Was there a force?"},
    {"role": "USER", "text": "No, because nothing happened. No movement means no force."},
    {"role": "ASSISTANT", "text": "What keeps a puck sliding on smooth ice?"},
    {"role": "USER", "text": "You need to keep pushing it or it stops. Force equals mass times velocity."},
    {"role": "ASSISTANT", "text": "Why velocity rather than acceleration?"},
    {"role": "USER", "text": "I'm not sure. I think I remember it as velocity from the formula."},
    {"role": "ASSISTANT", "text": "Is force something one object has, or something between two?"},
    {"role": "USER", "text": "It's something an object has. Strong things have more force in them."},
    {"role": "ASSISTANT", "text": "Can a force change something other than motion?"},
    {"role": "USER", "text": "Yes, it can squash or stretch something, like a spring."},
]


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


def main() -> int:
    generation_id, topic_id = discover_topic()
    student_turns = [t for t in TRANSCRIPT if t["role"] == "USER"]
    print(f"posting {len(TRANSCRIPT)} turns ({len(student_turns)} from the student)")

    with httpx.Client(base_url=BASE_URL, timeout=90) as client:
        response = client.post(
            "/api/v1/understanding-check/feedback",
            json={
                "generation_id": generation_id,
                "topic_id": topic_id,
                "transcript": TRANSCRIPT,
            },
        )

    print(f"HTTP {response.status_code}")
    if response.status_code != 200:
        print(response.text[:600])
        return 1

    data = response.json()
    print()
    print(json.dumps(data, indent=2)[:3200])
    print()

    ok = True
    required = {
        "topic_title",
        "grasp_level",
        "headline",
        "rubric",
        "overall_score",
        "understood_well",
        "needs_work",
        "misconceptions",
        "next_steps",
        "questions_asked",
        "questions_answered",
        "student_turns_analysed",
        "model_used",
    }
    missing = required - data.keys()
    if missing:
        print(f"FAIL  missing fields: {sorted(missing)}")
        ok = False
    else:
        print("PASS  all fields present")

    if data.get("grasp_level") in {"solid", "partial", "shaky"}:
        print(f"PASS  grasp_level valid: {data['grasp_level']}")
    else:
        print(f"FAIL  grasp_level invalid: {data.get('grasp_level')}")
        ok = False

    if data.get("student_turns_analysed") == len(student_turns):
        print(f"PASS  counted {len(student_turns)} substantive student turns")
    else:
        print(f"FAIL  turn count {data.get('student_turns_analysed')} != {len(student_turns)}")
        ok = False

    # Rubric: one entry per expected dimension, every score in range.
    expected_keys = [
        "conceptual_accuracy",
        "depth_of_reasoning",
        "terminology",
        "application",
        "clarity",
    ]
    rubric = data.get("rubric", [])
    actual_keys = [entry.get("key") for entry in rubric]
    if actual_keys == expected_keys:
        print(f"PASS  rubric has all {len(expected_keys)} dimensions in order")
    else:
        print(f"FAIL  rubric keys {actual_keys} != {expected_keys}")
        ok = False

    out_of_range = [
        entry for entry in rubric if not 0 <= entry.get("score", -1) <= entry.get("max_score", 5)
    ]
    if out_of_range:
        print(f"FAIL  scores out of range: {out_of_range}")
        ok = False
    else:
        print("PASS  all rubric scores within 0..max")

    uncommented = [entry["key"] for entry in rubric if not entry.get("comment", "").strip()]
    if uncommented:
        print(f"WARN  dimensions with no comment: {uncommented}")
    else:
        print("PASS  every dimension has a justification")

    if isinstance(data.get("overall_score"), int) and 0 <= data["overall_score"] <= 100:
        print(f"PASS  overall score in range: {data['overall_score']}%")
    else:
        print(f"FAIL  overall score invalid: {data.get('overall_score')}")
        ok = False

    print()
    print("  rubric breakdown:")
    for entry in rubric:
        print(f"    {entry['score']}/{entry['max_score']}  {entry['label']}: {entry.get('comment', '')}")
    print()

    if data.get("model_used") == "heuristic":
        print("WARN  ran the heuristic placeholder (no assessment model configured)")
    else:
        print(f"PASS  used a real model: {data['model_used']}")
        # This student was clearly wrong, so a real assessment must not say 'solid'.
        if data.get("grasp_level") == "solid":
            print("FAIL  graded a confidently-wrong student as 'solid'")
            ok = False
        else:
            print(f"PASS  did not over-grade a wrong student ({data['grasp_level']})")
        if data.get("misconceptions"):
            print(f"PASS  flagged {len(data['misconceptions'])} misconception(s)")
        else:
            print("FAIL  flagged no misconceptions despite two clear errors")
            ok = False

    print()
    print("RESULT:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
