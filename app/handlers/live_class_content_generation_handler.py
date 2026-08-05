from __future__ import annotations

import json
from uuid import UUID

from kink import di, inject

from app.application.services.live_class_generation_service import LiveClassGenerationService
from app.core.database import get_db
from app.core.dependencies import get_gemini_workflow_client, get_queue_client
from app.domain.interfaces import IUnitOfWork
from app.infrastructure.unit_of_work import UnitOfWork


def setup_di() -> None:
    database_session = next(get_db())
    di[IUnitOfWork] = UnitOfWork(database_session)
    di[LiveClassGenerationService] = LiveClassGenerationService(
        di[IUnitOfWork],
        get_queue_client(),
        get_gemini_workflow_client(),
    )


@inject
def handle(
    event: dict,
    _context,
    generation_service: LiveClassGenerationService = di[LiveClassGenerationService],
) -> dict:
    setup_di()
    for record in event.get("Records", []):
        message_body = json.loads(record["body"])
        generation_id = UUID(message_body["generation_id"])
        class_plan_id = UUID(message_body["class_plan_id"])
        generation_service.process_content_generation(generation_id, class_plan_id)
    return {"statusCode": 200, "body": "processed"}
