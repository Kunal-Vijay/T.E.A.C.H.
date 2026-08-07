"""Assesses a finished voice conversation using a Bedrock text model.

Preferred over the Gemini path because the AWS credentials needed for Nova Sonic
are already configured, so the assessment works without any extra setup.

Uses the Converse API (plain boto3 request/response) rather than the bidirectional
streaming client — this is a single prompt, not a live conversation.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from pydantic import validate_call

from app.config import settings
from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.exceptions import ValidationException
from app.infrastructure.assessment_response_parser import (
    RUBRIC_DIMENSIONS,
    extract_json_object,
    normalize_assessment,
)

logger = logging.getLogger(__name__)

def _build_instructions() -> str:
    dimension_lines = "\n".join(
        f'  "{key}" — {label}: {hint}' for key, label, hint in RUBRIC_DIMENSIONS
    )
    return f"""
You are an experienced teacher marking a short spoken viva. The examiner was instructed to ask
probing questions and never reveal answers, so the student's own words are the only evidence of
what they understand.

Assess ONLY the student's contributions. Rules:
- Judge what the STUDENT said. Never credit the student for something the examiner said.
- Address the student directly as "you".
- Be specific. Reference their actual words. No generic study advice.
- Turns where the student only said "sorry", "what", "can you repeat that" or similar are NOT
  answers. Ignore them entirely; do not treat them as evidence of anything.

Score each dimension from 0 to 5, where 0 means they never demonstrated it at all, 1-2 means
weak, 3 means adequate, 4 means good and 5 means excellent. Be strict: 5 requires correct
reasoning that they justified themselves. Give each score a one-sentence justification quoting
or paraphrasing what they said.

The dimensions are exactly:
{dimension_lines}

Also produce:
- grasp_level: "solid" only if they reasoned correctly AND justified it; "partial" if they had the
  gist but were vague or incomplete; "shaky" if core ideas were wrong or missing.
- headline: one honest sentence. Do not soften a poor performance.
- understood_well: things they genuinely got right. Use an empty list if there were none. Never
  invent praise to be kind.
- needs_work: specific concepts that were vague, incomplete or avoided.
- misconceptions: concrete incorrect beliefs they stated, each paired with the correction. This is
  the one place you SHOULD state the correct fact plainly.
- next_steps: two or three concrete actions, each tied to something in this transcript.
- Every list item is a single sentence.

Reply with a single JSON object and nothing else, in exactly this shape:
{{"grasp_level":"solid|partial|shaky","headline":"...",
"rubric":{{"conceptual_accuracy":{{"score":0,"comment":"..."}},
"depth_of_reasoning":{{"score":0,"comment":"..."}},
"terminology":{{"score":0,"comment":"..."}},
"application":{{"score":0,"comment":"..."}},
"clarity":{{"score":0,"comment":"..."}}}},
"understood_well":["..."],"needs_work":["..."],"misconceptions":["..."],"next_steps":["..."]}}
""".strip()


ASSESSMENT_INSTRUCTIONS = _build_instructions()


class BedrockAssessmentClient:
    def __init__(self, model_id: str | None = None, region: str | None = None) -> None:
        self.model_id = model_id or settings.BEDROCK_ASSESSMENT_MODEL_ID
        self.region = region or settings.AWS_REGION

    @validate_call(validate_return=True)
    def assess_understanding(
        self,
        topic_title: str,
        topic_material: str,
        transcript_text: str,
    ) -> dict[str, Any]:
        if transcript_text.strip() == "":
            raise ValidationException("transcript is empty, nothing to assess")
        if not settings.nova_sonic_is_configured:
            raise ValidationException("AWS credentials are not configured for the assessment model")

        operation = f"assess_understanding topic={topic_title} model={self.model_id}"
        user_message = (
            f"Topic: {topic_title}\n\n"
            f"What the class actually taught:\n{topic_material}\n\n"
            f"Transcript:\n{transcript_text}"
        )
        log_external_api_request(
            logger,
            "Bedrock",
            operation,
            json.dumps({"model": self.model_id, "message": user_message}, ensure_ascii=False),
        )

        client = boto3.client(
            "bedrock-runtime",
            region_name=self.region,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
            aws_session_token=settings.AWS_SESSION_TOKEN or None,
            config=BotoConfig(retries={"max_attempts": 3, "mode": "standard"}),
        )
        try:
            response = client.converse(
                modelId=self.model_id,
                system=[{"text": ASSESSMENT_INSTRUCTIONS}],
                messages=[{"role": "user", "content": [{"text": user_message}]}],
                inferenceConfig={"maxTokens": 2000, "temperature": 0.2, "topP": 0.9},
            )
        except ClientError as error:
            log_external_api_error(logger, "Bedrock", operation, error)
            raise ValidationException(f"Assessment generation failed: {error}") from error

        text = "".join(
            block.get("text", "") for block in response["output"]["message"]["content"]
        ).strip()
        log_external_api_response(logger, "Bedrock", operation, text)
        if text == "":
            raise ValidationException("Bedrock returned an empty assessment")

        return normalize_assessment(extract_json_object(text))
