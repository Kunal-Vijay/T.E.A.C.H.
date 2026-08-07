"""Turns a finished voice conversation into a written assessment.

Nova Sonic is deliberately kept terse and question-only during the session, so the
judgement about what the student actually understood is made afterwards, from the
transcript, by a text model.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import validate_call

from app.config import settings
from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.exceptions import ValidationException
from app.infrastructure.assessment_response_parser import (
    RUBRIC_DIMENSIONS,
    RUBRIC_KEYS,
    normalize_assessment,
)

logger = logging.getLogger(__name__)

_RUBRIC_ENTRY_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "key": {"type": "string", "enum": list(RUBRIC_KEYS)},
        "score": {"type": "integer"},
        "comment": {"type": "string"},
    },
    "required": ["key", "score", "comment"],
}

ASSESSMENT_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "grasp_level": {"type": "string", "enum": ["solid", "partial", "shaky"]},
        "headline": {"type": "string"},
        # A list rather than a keyed object: Gemini's response_schema has no
        # additionalProperties support, so a fixed-key object is awkward to express.
        "rubric": {"type": "array", "items": _RUBRIC_ENTRY_SCHEMA},
        "understood_well": {"type": "array", "items": {"type": "string"}},
        "needs_work": {"type": "array", "items": {"type": "string"}},
        "misconceptions": {"type": "array", "items": {"type": "string"}},
        "next_steps": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "grasp_level",
        "headline",
        "rubric",
        "understood_well",
        "needs_work",
        "misconceptions",
        "next_steps",
    ],
}


class GeminiAssessmentClient:
    @validate_call(validate_return=True)
    def assess_understanding(
        self,
        topic_title: str,
        topic_material: str,
        transcript_text: str,
    ) -> dict[str, Any]:
        if transcript_text.strip() == "":
            raise ValidationException("transcript is empty, nothing to assess")

        if settings.GEMINI_API_KEY.strip() == "":
            logger.warning("Assessment falling back to heuristic because GEMINI_API_KEY is not configured")
            return self._heuristic_assessment(topic_title, transcript_text)

        from google import genai

        operation = f"assess_understanding topic={topic_title}"
        dimension_lines = "\n".join(
            f"  - {key} ({label}): {hint}" for key, label, hint in RUBRIC_DIMENSIONS
        )
        prompt = (
            "You are an experienced teacher marking a short spoken viva. The examiner was "
            "instructed to ask probing questions and never reveal answers, so the student's own "
            "words are the only evidence of what they understand.\n\n"
            f"Topic: {topic_title}\n\n"
            f"What the class actually taught:\n{topic_material}\n\n"
            f"Transcript:\n{transcript_text}\n\n"
            "Assess ONLY the student's contributions. Rules:\n"
            "- Judge what the student said, never what the examiner said.\n"
            "- Address the student directly as 'you'.\n"
            "- Be specific and quote or paraphrase their actual words. No generic advice.\n"
            "- Turns where the student only said 'sorry', 'what', 'can you repeat that' or similar "
            "are NOT answers. Ignore them; they are not evidence of anything.\n"
            "- rubric: score every one of these keys from 0 to 5, where 0 means never demonstrated, "
            "3 is adequate and 5 requires correct reasoning they justified themselves. Give each a "
            "one-sentence comment referencing what they said.\n"
            f"{dimension_lines}\n"
            "- grasp_level: 'solid' if they reasoned correctly with justification, 'partial' if "
            "they had the gist but gaps or vagueness, 'shaky' if core ideas were wrong or absent.\n"
            "- understood_well: things they genuinely got right. Empty list if there were none. "
            "Do not invent praise.\n"
            "- needs_work: specific concepts that were vague, incomplete or dodged.\n"
            "- misconceptions: concrete incorrect beliefs they stated, with the correction. This is "
            "the one place you SHOULD state the correct physics or facts plainly.\n"
            "- next_steps: two or three concrete actions, each tied to something in this transcript.\n"
            "- headline: one honest sentence. Do not soften a poor performance into praise.\n"
            "- Keep every list item to one sentence.\n"
            "Return JSON only."
        )
        request_payload = json.dumps(
            {"model": settings.GEMINI_MODEL, "operation": operation, "prompt": prompt},
            ensure_ascii=False,
        )
        log_external_api_request(logger, "Gemini", operation, request_payload)

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ASSESSMENT_JSON_SCHEMA,
                },
            )
        except Exception as error:
            log_external_api_error(logger, "Gemini", operation, error, request_payload=request_payload)
            raise ValidationException(f"Assessment generation failed: {error}") from error

        if response.text is None or response.text.strip() == "":
            empty_error = ValidationException("Gemini returned an empty assessment")
            log_external_api_error(logger, "Gemini", operation, empty_error, request_payload=request_payload)
            raise empty_error

        log_external_api_response(logger, "Gemini", operation, response.text)
        try:
            parsed = json.loads(response.text)
        except json.JSONDecodeError as error:
            parse_error = ValidationException(f"Gemini returned invalid assessment JSON: {error}")
            log_external_api_error(logger, "Gemini", operation, parse_error, request_payload=request_payload)
            raise parse_error from error

        return normalize_assessment(parsed)

    def _heuristic_assessment(self, topic_title: str, transcript_text: str) -> dict[str, Any]:
        """Offline stand-in so the UI still works with no model configured."""
        student_lines = [
            line.partition(":")[2].strip()
            for line in transcript_text.splitlines()
            if line.lower().startswith("student:")
        ]
        spoken_words = sum(len(line.split()) for line in student_lines)
        return normalize_assessment(
            {
                "grasp_level": "partial" if spoken_words > 40 else "shaky",
                "headline": (
                    f"You answered {len(student_lines)} question(s) on {topic_title}, "
                    f"using about {spoken_words} words."
                ),
                # Deliberately unscored: pretending to grade without a model would be
                # worse than showing nothing.
                "rubric": {},
                "understood_well": [],
                "needs_work": [
                    "No assessment model is configured on the server, so this is a placeholder."
                ],
                "misconceptions": [],
                "next_steps": [
                    "Configure AWS credentials or GEMINI_API_KEY and restart the backend.",
                ],
            }
        )
