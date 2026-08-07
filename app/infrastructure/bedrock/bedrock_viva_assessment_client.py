"""Grades a finished spoken viva from its transcript.

Nova Sonic is kept deliberately terse and question-only during the viva, so the
judgement about what the student understood happens here afterwards, from the
transcript, using the same Bedrock text model the other modes use.

Goes through invoke_structured_tool so it inherits the project's forced tool-use
wiring, external-API logging, and the offline mock path used when no AWS
credentials are present.
"""

from __future__ import annotations

from typing import Any

from pydantic import validate_call

from app.domain.entities import TopicEntity
from app.infrastructure.assessment_response_parser import (
    RUBRIC_DIMENSIONS,
    RUBRIC_KEYS,
    normalize_assessment,
)
from app.infrastructure.bedrock.bedrock_mode_runtime import invoke_structured_tool
from app.infrastructure.bedrock.mode_prompt_builder import build_topic_context_text

_RUBRIC_ENTRY_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "key": {"type": "string", "enum": list(RUBRIC_KEYS)},
        "score": {"type": "integer"},
        "comment": {"type": "string"},
    },
    "required": ["key", "score", "comment"],
}

VIVA_ASSESSMENT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "grasp_level": {"type": "string", "enum": ["solid", "partial", "shaky"]},
        "headline": {"type": "string"},
        "rubric": {"type": "array", "items": _RUBRIC_ENTRY_SCHEMA},
        "understood_well": {"type": "array", "items": {"type": "string"}},
        "needs_work": {"type": "array", "items": {"type": "string"}},
        "misconceptions": {"type": "array", "items": {"type": "string"}},
        "next_steps": {"type": "array", "items": {"type": "string"}},
        "weak_toc_item_ids": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "grasp_level",
        "headline",
        "rubric",
        "understood_well",
        "needs_work",
        "misconceptions",
        "next_steps",
        "weak_toc_item_ids",
    ],
}


class BedrockVivaAssessmentClient:
    @validate_call(validate_return=True)
    def assess_viva(
        self,
        topic: TopicEntity,
        transcript_text: str,
        questions_asked: int,
        questions_answered: int,
    ) -> dict[str, Any]:
        dimension_lines = "\n".join(
            f"  - {key} ({label}): {hint}" for key, label, hint in RUBRIC_DIMENSIONS
        )
        toc_id_lines = "\n".join(
            f"  - {toc_item.id} = {toc_item.title}"
            for toc_item in sorted(topic.toc_items, key=lambda item: item.order)
        )
        prompt = (
            "You are an experienced teacher marking a short spoken viva. The examiner was "
            "instructed to ask probing questions and never reveal answers, so the student's own "
            "words are the only evidence of what they understand.\n\n"
            f"{build_topic_context_text(topic)}\n\n"
            f"Transcript of the viva:\n{transcript_text}\n\n"
            f"The examiner asked {questions_asked} question(s); the student answered "
            f"{questions_answered}.\n\n"
            "Assess ONLY the student's contributions. Rules:\n"
            "- Judge what the STUDENT said. Never credit them for something the examiner said.\n"
            "- Address the student directly as 'you'.\n"
            "- Be specific and reference their actual words. No generic study advice.\n"
            "- Turns where the student only said 'sorry', 'what', 'can you repeat that' or similar "
            "are NOT answers. Ignore them; they are not evidence of anything.\n"
            "- rubric: score every one of these keys from 0 to 5, where 0 means never demonstrated, "
            "3 is adequate, and 5 requires correct reasoning they justified themselves. Be strict. "
            "Give each a one-sentence comment referencing what they said.\n"
            f"{dimension_lines}\n"
            "- grasp_level: 'solid' only if they reasoned correctly AND justified it; 'partial' if "
            "they had the gist but were vague or incomplete; 'shaky' if core ideas were wrong or "
            "missing.\n"
            "- understood_well: things they genuinely got right. Empty list if there were none. "
            "Never invent praise to be kind.\n"
            "- needs_work: specific concepts that were vague, incomplete or avoided.\n"
            "- misconceptions: concrete incorrect beliefs they stated, each paired with the "
            "correction. This is the one place you SHOULD state the correct fact plainly.\n"
            "- next_steps: two or three concrete actions, each tied to something in this transcript.\n"
            "- headline: one honest sentence. Do not soften a poor performance.\n"
            "- weak_toc_item_ids: the table-of-contents ids the student was weakest on. Use exactly "
            "these ids:\n"
            f"{toc_id_lines if toc_id_lines != '' else '  (none)'}\n"
            "- Keep every list item to a single sentence."
        )

        raw = invoke_structured_tool(
            operation=f"viva_assessment topic={topic.title}",
            prompt=prompt,
            tool_name="record_viva_assessment",
            tool_description="Record the scored assessment of a finished spoken viva",
            tool_schema=VIVA_ASSESSMENT_SCHEMA,
            mock_response=self._mock_response(topic, questions_answered),
        )
        normalized = normalize_assessment(raw)
        valid_ids = {str(toc_item.id) for toc_item in topic.toc_items}
        normalized["weak_toc_item_ids"] = [
            str(item_id) for item_id in (raw.get("weak_toc_item_ids") or []) if str(item_id) in valid_ids
        ]
        return normalized

    def _mock_response(self, topic: TopicEntity, questions_answered: int) -> dict[str, Any]:
        """Offline stand-in so the viva still completes without AWS credentials.

        Deliberately unscored — pretending to grade without a model would be worse
        than showing nothing.
        """
        return {
            "grasp_level": "partial",
            "headline": (
                f"You answered {questions_answered} question(s) on {topic.title}. "
                "No assessment model is configured, so this is a placeholder."
            ),
            "rubric": [],
            "understood_well": [],
            "needs_work": ["Configure AWS credentials on the server for a real assessment."],
            "misconceptions": [],
            "next_steps": ["Ask your teacher to configure the assessment model."],
            "weak_toc_item_ids": [],
        }
