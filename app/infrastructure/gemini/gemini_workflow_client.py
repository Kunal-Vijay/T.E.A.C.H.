from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import validate_call

from app.config import settings
from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.entities import ClassPlanEntity, ClassPlanTopicEntity
from app.domain.exceptions import ValidationException
from app.domain.interfaces import IGeminiWorkflowClient
from app.infrastructure.gemini.topic_workflow_response_parser import normalize_topic_workflow_response
from app.infrastructure.gemini.topic_workflow_schema import TOPIC_WORKFLOW_JSON_SCHEMA

logger = logging.getLogger(__name__)

MAX_BASE_MATERIAL_PROMPT_LENGTH = 6000


class GeminiWorkflowClient(IGeminiWorkflowClient):
    @validate_call(validate_return=True)
    def generate_topic_workflow(self, class_plan: ClassPlanEntity, topic: ClassPlanTopicEntity) -> dict[str, Any]:
        if settings.GEMINI_API_KEY.strip() == "":
            raise ValidationException("GEMINI_API_KEY is required for class generation")
        if settings.GEMINI_MODEL.strip() == "":
            raise ValidationException("GEMINI_MODEL is required for class generation")

        from google import genai

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
            f"Teaching notes: {topic.teaching_notes}\n"
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
            "- Each pop_quiz_questions item must include question_id (uuid string), question_text, order, "
            "and options with option_id, text, is_correct, feedback_explanation\n"
            "- Do not return empty objects"
        )
        request_payload = json.dumps(
            {
                "model": settings.GEMINI_MODEL,
                "operation": operation,
                "prompt": prompt,
                "response_schema": TOPIC_WORKFLOW_JSON_SCHEMA,
            },
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
                    "response_schema": TOPIC_WORKFLOW_JSON_SCHEMA,
                },
            )
        except Exception as error:
            log_external_api_error(logger, "Gemini", operation, error, request_payload=request_payload)
            raise ValidationException(f"Gemini generation failed: {error}") from error

        if response.text is None or response.text.strip() == "":
            empty_response_error = ValidationException("Gemini returned an empty response for topic workflow generation")
            log_external_api_error(
                logger,
                "Gemini",
                operation,
                empty_response_error,
                request_payload=request_payload,
            )
            raise empty_response_error

        log_external_api_response(logger, "Gemini", operation, response.text)
        try:
            generated_topic = json.loads(response.text)
            normalized_topic = normalize_topic_workflow_response(generated_topic)
        except ValidationException as error:
            log_external_api_error(logger, "Gemini", operation, error, request_payload=request_payload)
            raise
        except json.JSONDecodeError as error:
            parse_error = ValidationException(f"Gemini returned invalid JSON: {error}")
            log_external_api_error(logger, "Gemini", operation, parse_error, request_payload=request_payload)
            raise parse_error from error

        logger.info(
            "Gemini workflow validated for topic=%s approach=%s slides=%s quiz_questions=%s",
            topic.title,
            normalized_topic.get("teaching_approach"),
            len(normalized_topic.get("slides", [])),
            len(normalized_topic.get("pop_quiz_questions", [])),
        )
        return normalized_topic
