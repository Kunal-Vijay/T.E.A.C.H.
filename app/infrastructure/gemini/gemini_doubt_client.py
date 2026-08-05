from __future__ import annotations

import json
import logging

from pydantic import validate_call

from app.config import settings
from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.exceptions import ValidationException
from app.domain.interfaces import IGeminiDoubtClient

logger = logging.getLogger(__name__)


class GeminiDoubtClient(IGeminiDoubtClient):
    @validate_call(validate_return=True)
    def resolve_doubt(
        self,
        topic_context: dict,
        conversation_history: list[dict],
        student_message: str,
    ) -> str:
        if settings.GEMINI_API_KEY.strip() == "":
            logger.warning("SAGE mock response used because GEMINI_API_KEY is not configured")
            return (
                f"Great question! Based on what we covered in {topic_context.get('topic_title', 'this topic')}, "
                f"let me clarify: {student_message} relates to the core concepts we discussed. "
                "Remember the key points from the slides and examples we just went through."
            )
        if settings.GEMINI_MODEL.strip() == "":
            raise ValidationException("GEMINI_MODEL is required for doubt resolution")

        from google import genai

        operation = f"resolve_doubt topic={topic_context.get('topic_title', 'unknown')}"
        history_text = "\n".join(
            [
                f"Student: {message.get('student_message', '')}\nSAGE: {message.get('ai_response', '')}"
                for message in conversation_history
            ]
        )
        prompt = (
            "You are SAGE — Smart AI for Guided Explanations. "
            "Answer only within the provided topic context. "
            f"Topic context: {topic_context}\n"
            f"Conversation history:\n{history_text}\n"
            f"Student doubt: {student_message}"
        )
        request_payload = json.dumps(
            {
                "model": settings.GEMINI_MODEL,
                "operation": operation,
                "prompt": prompt,
            },
            ensure_ascii=False,
        )
        log_external_api_request(logger, "Gemini", operation, request_payload)

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        try:
            response = client.models.generate_content(model=settings.GEMINI_MODEL, contents=prompt)
        except Exception as error:
            log_external_api_error(logger, "Gemini", operation, error, request_payload=request_payload)
            raise ValidationException(f"SAGE doubt resolution failed: {error}") from error

        if response.text is None or response.text.strip() == "":
            empty_response_error = ValidationException("Gemini returned an empty SAGE response")
            log_external_api_error(
                logger,
                "Gemini",
                operation,
                empty_response_error,
                request_payload=request_payload,
            )
            raise empty_response_error

        log_external_api_response(logger, "Gemini", operation, response.text)
        return response.text
