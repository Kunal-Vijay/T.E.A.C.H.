from __future__ import annotations

from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.services.class_plan_service import ClassPlanService
from app.application.services.classroom_session_service import ClassroomSessionService
from app.application.services.doubt_session_service import DoubtSessionService
from app.application.services.learning_session_service import LearningSessionService
from app.application.services.live_class_generation_service import LiveClassGenerationService
from app.application.services.student_profile_service import StudentProfileService
from app.application.services.topic_service import TopicService
from app.application.services.tts_service import TtsService
from app.application.services.workflow_navigation_service import WorkflowNavigationService
from app.core.database import get_db
from app.domain.interfaces import (
    ILLMDoubtClient,
    ILLMInteractiveDoubtClient,
    ILLMTeachClient,
    ILLMVivaClient,
    ILLMWorkflowClient,
    IQueueClient,
    IUnitOfWork,
)
from app.infrastructure.bedrock.bedrock_doubt_client import BedrockDoubtClient
from app.infrastructure.bedrock.bedrock_interactive_doubt_client import BedrockInteractiveDoubtClient
from app.infrastructure.bedrock.bedrock_teach_client import BedrockTeachClient
from app.infrastructure.bedrock.bedrock_viva_client import BedrockVivaClient
from app.infrastructure.bedrock.bedrock_workflow_client import BedrockWorkflowClient
from app.infrastructure.queue.sqs_queue_client import SQSQueueClient
from app.infrastructure.unit_of_work import UnitOfWork


def get_unit_of_work(database_session: Session = Depends(get_db)) -> Generator[IUnitOfWork, None, None]:
    unit_of_work = UnitOfWork(database_session)
    yield unit_of_work


def get_queue_client() -> IQueueClient:
    return SQSQueueClient()


def get_llm_workflow_client() -> ILLMWorkflowClient:
    return BedrockWorkflowClient()


def get_llm_doubt_client() -> ILLMDoubtClient:
    return BedrockDoubtClient()


def get_llm_teach_client() -> ILLMTeachClient:
    return BedrockTeachClient()


def get_llm_interactive_doubt_client() -> ILLMInteractiveDoubtClient:
    return BedrockInteractiveDoubtClient()


def get_llm_viva_client() -> ILLMVivaClient:
    return BedrockVivaClient()


def get_workflow_navigation_service(unit_of_work: IUnitOfWork = Depends(get_unit_of_work)) -> WorkflowNavigationService:
    return WorkflowNavigationService(unit_of_work)


def get_class_plan_service(unit_of_work: IUnitOfWork = Depends(get_unit_of_work)) -> ClassPlanService:
    return ClassPlanService(unit_of_work)


def get_topic_service(unit_of_work: IUnitOfWork = Depends(get_unit_of_work)) -> TopicService:
    return TopicService(unit_of_work)


def get_student_profile_service(
    unit_of_work: IUnitOfWork = Depends(get_unit_of_work),
) -> StudentProfileService:
    return StudentProfileService(unit_of_work)


def get_learning_session_service(
    unit_of_work: IUnitOfWork = Depends(get_unit_of_work),
    teach_client: ILLMTeachClient = Depends(get_llm_teach_client),
    doubt_client: ILLMInteractiveDoubtClient = Depends(get_llm_interactive_doubt_client),
    viva_client: ILLMVivaClient = Depends(get_llm_viva_client),
) -> LearningSessionService:
    return LearningSessionService(
        unit_of_work,
        teach_client,
        doubt_client,
        viva_client,
    )


def get_live_class_generation_service(
    unit_of_work: IUnitOfWork = Depends(get_unit_of_work),
    queue_client: IQueueClient = Depends(get_queue_client),
    llm_workflow_client: ILLMWorkflowClient = Depends(get_llm_workflow_client),
) -> LiveClassGenerationService:
    return LiveClassGenerationService(unit_of_work, queue_client, llm_workflow_client)


def get_classroom_session_service(
    unit_of_work: IUnitOfWork = Depends(get_unit_of_work),
    workflow_navigation_service: WorkflowNavigationService = Depends(get_workflow_navigation_service),
) -> ClassroomSessionService:
    return ClassroomSessionService(unit_of_work, workflow_navigation_service)


def get_doubt_session_service(
    unit_of_work: IUnitOfWork = Depends(get_unit_of_work),
    llm_doubt_client: ILLMDoubtClient = Depends(get_llm_doubt_client),
    classroom_session_service: ClassroomSessionService = Depends(get_classroom_session_service),
    workflow_navigation_service: WorkflowNavigationService = Depends(get_workflow_navigation_service),
) -> DoubtSessionService:
    return DoubtSessionService(
        unit_of_work,
        llm_doubt_client,
        classroom_session_service,
        workflow_navigation_service,
    )


def get_tts_service() -> TtsService:
    return TtsService()
