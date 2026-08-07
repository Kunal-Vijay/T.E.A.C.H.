"""Coerces assessment replies from a text model into the shape the DTO expects.

Shared by the Bedrock and Gemini assessment clients. Models are inconsistent about
list items: asked for a list of strings they will sometimes return a list of objects
like {"misconception": "...", "correction": "..."}. Naively str()-ing those leaks a
Python dict repr into the UI, so they are flattened into readable sentences here.
"""

from __future__ import annotations

import json
import re
from typing import Any

from app.domain.exceptions import ValidationException

GRASP_LEVELS = {"solid", "partial", "shaky"}

# The dimensions the student is scored on. Chosen to separate genuine understanding
# from recall: a student can score well on accuracy and terminology while scoring
# badly on reasoning and transfer, and that gap is the useful signal.
RUBRIC_DIMENSIONS: tuple[tuple[str, str, str], ...] = (
    (
        "conceptual_accuracy",
        "Conceptual accuracy",
        "Were the facts and definitions they gave actually correct?",
    ),
    (
        "depth_of_reasoning",
        "Depth of reasoning",
        "Did they explain why, or only state what? Could they justify their answers?",
    ),
    (
        "terminology",
        "Use of terminology",
        "Did they use the correct technical vocabulary precisely rather than vaguely?",
    ),
    (
        "application",
        "Applying to new cases",
        "Could they transfer the idea to a situation that was not in the lesson?",
    ),
    (
        "clarity",
        "Clarity of explanation",
        "Was the explanation structured and followable, or scattered?",
    ),
)

RUBRIC_KEYS = tuple(key for key, _label, _hint in RUBRIC_DIMENSIONS)
RUBRIC_LABELS = {key: label for key, label, _hint in RUBRIC_DIMENSIONS}
MAX_DIMENSION_SCORE = 5

# Ordered so the flattened sentence reads naturally: claim first, correction after.
_PREFERRED_KEY_ORDER = (
    "misconception",
    "belief",
    "claim",
    "statement",
    "issue",
    "concept",
    "topic",
    "item",
    "text",
    "detail",
    "description",
    "correction",
    "correct",
    "reality",
    "fix",
    "explanation",
    "why",
    "action",
    "step",
)


def flatten_item(item: Any) -> str:
    """Turn one list entry into a single readable sentence."""
    if isinstance(item, str):
        return item.strip()
    if isinstance(item, (int, float, bool)):
        return str(item)
    if isinstance(item, list):
        parts = [flatten_item(entry) for entry in item]
        return " ".join(part for part in parts if part != "")
    if isinstance(item, dict):
        seen: list[str] = []
        for key in _PREFERRED_KEY_ORDER:
            if key in item:
                value = flatten_item(item[key])
                if value != "" and value not in seen:
                    seen.append(value)
        # Include any remaining values so nothing is silently dropped.
        for key, value in item.items():
            if key in _PREFERRED_KEY_ORDER:
                continue
            flattened = flatten_item(value)
            if flattened != "" and flattened not in seen:
                seen.append(flattened)
        joined = " ".join(seen)
        # Make sure the claim and its correction are separated by a sentence break.
        return re.sub(r"\s+", " ", joined).strip()
    return ""


def as_string_list(value: Any) -> list[str]:
    if isinstance(value, str):
        text = value.strip()
        return [text] if text != "" else []
    if not isinstance(value, list):
        flattened = flatten_item(value)
        return [flattened] if flattened != "" else []
    items = [flatten_item(entry) for entry in value]
    return [item for item in items if item != ""]


def _coerce_score(value: Any) -> int | None:
    """Pull an integer 0..5 out of whatever the model returned."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        number = float(value)
    elif isinstance(value, str):
        match = re.search(r"-?\d+(?:\.\d+)?", value)
        if match is None:
            return None
        number = float(match.group())
        # Tolerate "8/10" style answers by rescaling.
        denominator = re.search(r"/\s*(\d+)", value)
        if denominator is not None:
            scale = float(denominator.group(1))
            if scale > 0:
                number = number / scale * MAX_DIMENSION_SCORE
    else:
        return None
    return max(0, min(MAX_DIMENSION_SCORE, round(number)))


def normalize_rubric(raw: Any) -> list[dict[str, Any]]:
    """Coerce the model's rubric into one entry per known dimension, in order.

    Accepts either a mapping of key -> score/object, or a list of objects. Any
    dimension the model omitted is scored 0 with an explicit note, rather than being
    dropped — a missing dimension usually means the student never demonstrated it.
    """
    by_key: dict[str, dict[str, Any]] = {}

    if isinstance(raw, dict):
        for key, value in raw.items():
            normalized_key = str(key).strip().lower().replace(" ", "_").replace("-", "_")
            if isinstance(value, dict):
                by_key[normalized_key] = {
                    "score": _coerce_score(
                        value.get("score", value.get("rating", value.get("value")))
                    ),
                    "comment": flatten_item(
                        value.get("comment", value.get("justification", value.get("reason", "")))
                    ),
                }
            else:
                by_key[normalized_key] = {"score": _coerce_score(value), "comment": ""}
    elif isinstance(raw, list):
        for entry in raw:
            if not isinstance(entry, dict):
                continue
            key_source = entry.get("key", entry.get("dimension", entry.get("label", "")))
            normalized_key = (
                str(key_source).strip().lower().replace(" ", "_").replace("-", "_")
            )
            by_key[normalized_key] = {
                "score": _coerce_score(entry.get("score", entry.get("rating"))),
                "comment": flatten_item(
                    entry.get("comment", entry.get("justification", entry.get("reason", "")))
                ),
            }

    rubric: list[dict[str, Any]] = []
    for key, label, _hint in RUBRIC_DIMENSIONS:
        found = by_key.get(key)
        if found is None:
            # Try a looser match, e.g. "accuracy" for "conceptual_accuracy".
            for candidate_key, candidate in by_key.items():
                if candidate_key in key or key in candidate_key:
                    found = candidate
                    break
        score = found["score"] if found is not None else None
        comment = found["comment"] if found is not None else ""
        rubric.append(
            {
                "key": key,
                "label": label,
                "score": score if score is not None else 0,
                "max_score": MAX_DIMENSION_SCORE,
                "comment": comment or ("Not demonstrated in this session." if score is None else ""),
            }
        )
    return rubric


def overall_percentage(rubric: list[dict[str, Any]]) -> int:
    if not rubric:
        return 0
    total = sum(int(entry.get("score", 0)) for entry in rubric)
    possible = sum(int(entry.get("max_score", MAX_DIMENSION_SCORE)) for entry in rubric)
    if possible <= 0:
        return 0
    return max(0, min(100, round(total / possible * 100)))


def normalize_assessment(parsed: dict[str, Any]) -> dict[str, Any]:
    grasp = str(parsed.get("grasp_level", "partial")).strip().lower()
    if grasp not in GRASP_LEVELS:
        grasp = "partial"
    rubric = normalize_rubric(parsed.get("rubric") or parsed.get("scores"))
    return {
        "grasp_level": grasp,
        "headline": flatten_item(parsed.get("headline", "")) or "Here is how that session went.",
        "rubric": rubric,
        "overall_score": overall_percentage(rubric),
        "understood_well": as_string_list(parsed.get("understood_well")),
        "needs_work": as_string_list(parsed.get("needs_work")),
        "misconceptions": as_string_list(parsed.get("misconceptions")),
        "next_steps": as_string_list(parsed.get("next_steps")),
    }


def extract_json_object(text: str) -> dict[str, Any]:
    """Pull a JSON object out of a model reply.

    Bedrock's Converse API has no response-schema parameter, so the model may wrap
    its JSON in prose or a markdown fence.
    """
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.+?)\s*```", cleaned, re.DOTALL)
    if fenced is not None:
        cleaned = fenced.group(1).strip()

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end > start:
        try:
            parsed = json.loads(cleaned[start : end + 1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError as error:
            raise ValidationException(f"Assessment model returned unparseable JSON: {error}") from error

    raise ValidationException("Assessment model returned no JSON object")
