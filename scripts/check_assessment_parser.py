"""Unit checks for the assessment response parser.

The live model returned objects inside `misconceptions` rather than strings, which
leaked Python dict reprs into the UI. These cases lock that behaviour down.
"""

from __future__ import annotations

import sys

from app.infrastructure.assessment_response_parser import (
    extract_json_object,
    flatten_item,
    normalize_assessment,
)

FLATTEN_CASES = [
    # The exact shape amazon.nova-lite-v1:0 actually returned.
    (
        {
            "misconception": "Force equals mass times velocity.",
            "correction": "Force equals mass times acceleration (F = ma).",
        },
        "Force equals mass times velocity. Force equals mass times acceleration (F = ma).",
    ),
    ("already a string", "already a string"),
    ("  padded  ", "padded"),
    ({"text": "just text"}, "just text"),
    ({"belief": "A", "correction": "B"}, "A B"),
    # Unknown keys must still survive rather than be dropped.
    ({"weird_key": "kept anyway"}, "kept anyway"),
    ({"claim": "X", "unknown": "Y"}, "X Y"),
    (["a", "b"], "a b"),
    ({}, ""),
    (None, ""),
]

JSON_CASES = [
    ('{"grasp_level": "solid"}', {"grasp_level": "solid"}),
    ('```json\n{"grasp_level": "shaky"}\n```', {"grasp_level": "shaky"}),
    ('```\n{"grasp_level": "partial"}\n```', {"grasp_level": "partial"}),
    ('Sure! Here it is: {"grasp_level": "solid"} Hope that helps.', {"grasp_level": "solid"}),
]


def main() -> int:
    failures: list[str] = []

    for value, expected in FLATTEN_CASES:
        actual = flatten_item(value)
        if actual != expected:
            failures.append(f"flatten_item({value!r}) -> {actual!r}, expected {expected!r}")
    print(f"flatten_item        : {len(FLATTEN_CASES) - len([f for f in failures if 'flatten' in f])}/{len(FLATTEN_CASES)} pass")

    for text, expected in JSON_CASES:
        actual = extract_json_object(text)
        if actual != expected:
            failures.append(f"extract_json_object({text!r}) -> {actual!r}")
    print(f"extract_json_object : {len(JSON_CASES) - len([f for f in failures if 'extract' in f])}/{len(JSON_CASES)} pass")

    # End to end on the real malformed payload.
    normalized = normalize_assessment(
        {
            "grasp_level": "PARTIAL",
            "headline": "Partial understanding",
            "understood_well": [],
            "needs_work": ["Something vague."],
            "misconceptions": [
                {
                    "misconception": "Force equals mass times velocity.",
                    "correction": "Force equals mass times acceleration (F = ma).",
                },
                {
                    "misconception": "Force is something an object has.",
                    "correction": "Force is an interaction between two objects.",
                },
            ],
            "next_steps": ["Review F = ma."],
        }
    )
    print()
    print("normalized misconceptions:")
    for item in normalized["misconceptions"]:
        print(f"  - {item}")

    for item in normalized["misconceptions"]:
        if "{" in item or "'" in item[:2] or "misconception" in item.lower():
            failures.append(f"dict repr leaked into output: {item!r}")
    if normalized["grasp_level"] != "partial":
        failures.append(f"grasp_level not lowercased: {normalized['grasp_level']!r}")

    # Bad grasp levels must fall back rather than reach the DTO.
    if normalize_assessment({"grasp_level": "excellent"})["grasp_level"] != "partial":
        failures.append("invalid grasp_level did not fall back to partial")
    if normalize_assessment({})["headline"] == "":
        failures.append("empty headline was not defaulted")

    print()
    if failures:
        for failure in failures:
            print(f"FAIL  {failure}")
    print("RESULT:", "PASS" if not failures else "FAIL")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
