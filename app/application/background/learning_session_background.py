from __future__ import annotations

import logging
from uuid import UUID

from app.application.services.learning_session_service import LearningSessionService
from app.core.database import SessionFactory
from app.infrastructure.bedrock.bedrock_interactive_doubt_client import BedrockInteractiveDoubtClient
from app.infrastructure.bedrock.bedrock_teach_client import BedrockTeachClient
from app.infrastructure.bedrock.bedrock_viva_client import BedrockVivaClient
from app.infrastructure.unit_of_work import UnitOfWork

logger = logging.getLogger(__name__)


def run_sync_generate_first_tutor_turn(session_id: UUID) -> None:
    logger.info("Background first tutor turn started session_id=%s", session_id)
    database_session = SessionFactory()
    try:
        unit_of_work = UnitOfWork(database_session)
        session_service = LearningSessionService(
            unit_of_work,
            BedrockTeachClient(),
            BedrockInteractiveDoubtClient(),
            BedrockVivaClient(),
        )
        session_service.generate_first_tutor_turn(session_id)
        logger.info("Background first tutor turn finished session_id=%s", session_id)
    except Exception as error:
        logger.exception(
            "Background first tutor turn crashed session_id=%s error=%s",
            session_id,
            error,
        )
        raise
    finally:
        database_session.close()
