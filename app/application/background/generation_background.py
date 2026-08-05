from __future__ import annotations

import logging
from uuid import UUID

from app.application.services.live_class_generation_service import LiveClassGenerationService
from app.core.database import Session
from app.infrastructure.gemini.gemini_workflow_client import GeminiWorkflowClient
from app.infrastructure.queue.sqs_queue_client import SQSQueueClient
from app.infrastructure.unit_of_work import UnitOfWork

logger = logging.getLogger(__name__)


def run_sync_content_generation(generation_id: UUID, class_plan_id: UUID) -> None:
    logger.info(
        "Background generation task started generation_id=%s plan_id=%s",
        generation_id,
        class_plan_id,
    )
    database_session = Session()
    try:
        unit_of_work = UnitOfWork(database_session)
        generation_service = LiveClassGenerationService(
            unit_of_work,
            SQSQueueClient(),
            GeminiWorkflowClient(),
        )
        generation_service.process_content_generation(generation_id, class_plan_id)
        logger.info(
            "Background generation task finished generation_id=%s plan_id=%s",
            generation_id,
            class_plan_id,
        )
    except Exception as error:
        logger.exception(
            "Background generation task crashed generation_id=%s plan_id=%s error=%s",
            generation_id,
            class_plan_id,
            error,
        )
        raise
    finally:
        database_session.close()
        Session.remove()
