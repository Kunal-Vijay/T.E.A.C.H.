from __future__ import annotations

import json
import logging

from pydantic import validate_call

from app.config import settings
from app.core.log_utils import log_external_api_error, log_external_api_request, log_external_api_response
from app.domain.exceptions import ValidationException
from app.domain.interfaces import ILLMDoubtClient
from app.infrastructure.bedrock.bedrock_runtime_client import (
    extract_converse_text,
    get_bedrock_runtime_client,
    has_aws_credentials,
)

logger = logging.getLogger(__name__)


class BedrockDoubtClient(ILLMDoubtClient):
    @validate_call(validate_return=True)
    def resolve_doubt(
        self,
        topic_context: dict,
        conversation_history: list[dict],
        student_message: str,
    ) -> str:
        if not has_aws_credentials():
            logger.warning("SAGE mock response used because AWS credentials are not configured")
            return (
                f"Great question! Based on what we covered in {topic_context.get('topic_title', 'this topic')}, "
                f"let me clarify: {student_message} relates to the core concepts we discussed. "
                "Remember the key points from the slides and examples we just went through."
            )
        if settings.BEDROCK_MODEL_ID.strip() == "":
            raise ValidationException("BEDROCK_MODEL_ID is required for doubt resolution")
        if settings.BEDROCK_REGION.strip() == "":
            raise ValidationException("BEDROCK_REGION is required for doubt resolution")

        doubt_model_id = settings.resolve_doubt_model_id()
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
                "model": doubt_model_id,
                "operation": operation,
                "prompt": prompt,
                "max_tokens": settings.BEDROCK_DOUBT_MAX_TOKENS,
            },
            ensure_ascii=False,
        )
        log_external_api_request(logger, "Bedrock", operation, request_payload)

        bedrock_client = get_bedrock_runtime_client()
        try:
            response = bedrock_client.converse(
                modelId=doubt_model_id,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"maxTokens": settings.BEDROCK_DOUBT_MAX_TOKENS},
            )
        except Exception as error:
            log_external_api_error(logger, "Bedrock", operation, error, request_payload=request_payload)
            raise ValidationException(f"SAGE doubt resolution failed: {error}") from error

        response_text = extract_converse_text(response)
        if response_text.strip() == "":
            empty_response_error = ValidationException("Bedrock returned an empty SAGE response")
            log_external_api_error(
                logger,
                "Bedrock",
                operation,
                empty_response_error,
                request_payload=request_payload,
            )
            raise empty_response_error

        log_external_api_response(logger, "Bedrock", operation, response_text)
        return response_text
