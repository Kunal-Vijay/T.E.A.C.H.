from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import validate_call

from app.config import settings
from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.entities import ClassPlanEntity, ClassPlanTopicEntity
from app.domain.exceptions import ValidationException
from app.domain.interfaces import ILLMWorkflowClient
from app.infrastructure.bedrock.bedrock_runtime_client import (
    extract_tool_use_input,
    get_bedrock_runtime_client,
    has_aws_credentials,
)
from app.infrastructure.bedrock.topic_workflow_response_parser import normalize_topic_workflow_response
from app.infrastructure.bedrock.topic_workflow_schema import TOPIC_WORKFLOW_JSON_SCHEMA

logger = logging.getLogger(__name__)

MAX_BASE_MATERIAL_PROMPT_LENGTH = 6000
TOPIC_WORKFLOW_TOOL_NAME = "generate_topic_workflow"


class BedrockWorkflowClient(ILLMWorkflowClient):
    @validate_call(validate_return=True)
    def generate_topic_workflow(self, class_plan: ClassPlanEntity, topic: ClassPlanTopicEntity) -> dict[str, Any]:
        if settings.BEDROCK_MODEL_ID.strip() == "":
            raise ValidationException("BEDROCK_MODEL_ID is required for class generation")
        if settings.BEDROCK_REGION.strip() == "":
            raise ValidationException("BEDROCK_REGION is required for class generation")
        if not has_aws_credentials():
            raise ValidationException("AWS credentials are required for class generation")

        operation = f"generate_topic_workflow topic={topic.title}"
        base_material = topic.base_material
        if len(base_material) > MAX_BASE_MATERIAL_PROMPT_LENGTH:
            base_material = (
                f"{base_material[:MAX_BASE_MATERIAL_PROMPT_LENGTH]}\n"
                "[Material truncated for generation. Focus on the most important concepts above.]"
            )

        prompt = (
            f"You are an expert tutor for {class_plan.target_exam}. "
            f"Generate a complete classroom workflow JSON for topic: {topic.title}. "
            f"Topic duration: {topic.duration_minutes} minutes. "
            f"Base material:\n{base_material}\n"
            f"Teaching guidelines (for your planning only — do not copy into spoken scripts): {topic.teaching_guidelines}\n"
            "Return JSON only. Every object must be fully populated.\n"
            "Rules:\n"
            "- teaching_approach must be exactly direct_instruction or inquiry_based\n"
            "- approach_rationale must be a short paragraph\n"
            "- workflow.states must include explain, examples, pop_quiz, and doubts_resolution states\n"
            "- state_type must be one of: ask_question, student_predict, explain, examples, pop_quiz, doubts_resolution\n"
            "- advance_trigger must be one of: auto, student_submitted, all_questions_attempted, doubt_session_closed_or_skipped\n"
            "- phase must be one of: teach, pop_quiz, doubts_resolution\n"
            "- Each slide must include slide_id (uuid string), workflow_state_id, layout, duration_seconds, "
            "elements (non-empty array), and explanation with duration_seconds and explanation_text\n"
            "- explanation_text is the exact voice script the AI teacher speaks to students on that slide\n"
            "- Write explanation_text as a teacher teaching the topic: warm, clear, conversational, and spoken aloud\n"
            "- explanation_text must use direct speech to students (e.g. 'Push your chair now. What do you feel?')\n"
            "- Never write facilitator directions in explanation_text (no 'Begin with this slide', "
            "'Allow 2-3 students to share', 'The goal is to surface', or similar meta-instructions)\n"
            "- Teach the concept in explanation_text; do not describe how the teacher should run the activity\n"
            "- Slide element content should be concise on-screen text; explanation_text carries the full teaching narration\n"
            "- Each pop_quiz_questions item must include question_id (uuid string), question_text, order, "
            "and options with option_id, text, is_correct, feedback_explanation\n"
            "- Do not return empty objects"
        )
        request_payload = json.dumps(
            {
                "model": settings.BEDROCK_MODEL_ID,
                "operation": operation,
                "prompt": prompt,
                "response_schema": TOPIC_WORKFLOW_JSON_SCHEMA,
            },
            ensure_ascii=False,
        )
        log_external_api_request(logger, "Bedrock", operation, request_payload)

        bedrock_client = get_bedrock_runtime_client()
        try:
            response = bedrock_client.converse(
                modelId=settings.BEDROCK_MODEL_ID,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                toolConfig={
                    "tools": [
                        {
                            "toolSpec": {
                                "name": TOPIC_WORKFLOW_TOOL_NAME,
                                "description": "Generate classroom workflow JSON",
                                "inputSchema": {"json": TOPIC_WORKFLOW_JSON_SCHEMA},
                            }
                        }
                    ],
                    "toolChoice": {"tool": {"name": TOPIC_WORKFLOW_TOOL_NAME}},
                },
                inferenceConfig={"maxTokens": 16384},
            )
        except Exception as error:
            log_external_api_error(logger, "Bedrock", operation, error, request_payload=request_payload)
            raise ValidationException(f"Bedrock generation failed: {error}") from error

        generated_topic = extract_tool_use_input(response)
        if len(generated_topic) == 0:
            empty_response_error = ValidationException(
                "Bedrock returned an empty response for topic workflow generation"
            )
            log_external_api_error(
                logger,
                "Bedrock",
                operation,
                empty_response_error,
                request_payload=request_payload,
            )
            raise empty_response_error

        log_external_api_response(logger, "Bedrock", operation, json.dumps(generated_topic, ensure_ascii=False))
        try:
            normalized_topic = normalize_topic_workflow_response(generated_topic)
        except ValidationException as error:
            log_external_api_error(logger, "Bedrock", operation, error, request_payload=request_payload)
            raise
        except json.JSONDecodeError as error:
            parse_error = ValidationException(f"Bedrock returned invalid JSON: {error}")
            log_external_api_error(logger, "Bedrock", operation, parse_error, request_payload=request_payload)
            raise parse_error from error

        logger.info(
            "Bedrock workflow validated for topic=%s approach=%s slides=%s quiz_questions=%s",
            topic.title,
            normalized_topic.get("teaching_approach"),
            len(normalized_topic.get("slides", [])),
            len(normalized_topic.get("pop_quiz_questions", [])),
        )
        return normalized_topic
