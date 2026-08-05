from __future__ import annotations

import uuid
from datetime import UTC, datetime
from uuid import UUID

from pydantic import validate_call

from app.application.dtos.doubt.doubt_session_dto import (
    DoubtMessageRequestDTO,
    DoubtMessageResponseDTO,
    DoubtSessionDetailResponseDTO,
    DoubtSessionResponseDTO,
)
from app.application.dtos.workflow.current_state_response_dto import CurrentStateResponseDTO
from app.application.services.classroom_session_service import ClassroomSessionService
from app.application.services.workflow_navigation_service import WorkflowNavigationService
from app.domain.entities import DoubtMessageEntity, DoubtSessionEntity
from app.domain.enums import DoubtSessionStatus, WorkflowStateType
from app.domain.exceptions import (
    ClassroomSessionNotFoundException,
    DoubtSessionNotFoundException,
    InvalidWorkflowStateException,
    ValidationException,
)
from app.domain.interfaces import IGeminiDoubtClient, IUnitOfWork


class DoubtSessionService:
    def __init__(
        self,
        unit_of_work: IUnitOfWork,
        gemini_doubt_client: IGeminiDoubtClient,
        classroom_session_service: ClassroomSessionService,
        workflow_navigation_service: WorkflowNavigationService,
    ) -> None:
        self.unit_of_work = unit_of_work
        self.gemini_doubt_client = gemini_doubt_client
        self.classroom_session_service = classroom_session_service
        self.workflow_navigation_service = workflow_navigation_service

    @validate_call(validate_return=True)
    def create_doubt_session(self, session_id: UUID) -> DoubtSessionResponseDTO:
        with self.unit_of_work:
            classroom_session = self.unit_of_work.classroom_session_repository.find_by_id(session_id)
            if classroom_session is None:
                raise ClassroomSessionNotFoundException(f"Classroom session {session_id} not found")
            workflow = self.unit_of_work.live_class_repository.find_workflow_by_topic(
                classroom_session.generation_id,
                classroom_session.current_topic_id,
            )
            if workflow is None:
                raise InvalidWorkflowStateException("Workflow not found")
            current_state = next(
                state for state in workflow.states if state.state_id == classroom_session.current_state_id
            )
            if current_state.state_type != WorkflowStateType.DOUBTS_RESOLUTION:
                raise ValidationException("Session is not in doubts resolution state")
            existing_session = self.unit_of_work.doubt_session_repository.find_active_by_session_and_topic(
                session_id,
                classroom_session.current_topic_id,
            )
            if existing_session is not None:
                return DoubtSessionResponseDTO.from_entity(existing_session)
            topic_context = self._build_topic_context(session_id, classroom_session.generation_id, classroom_session.current_topic_id)
            doubt_session_entity = DoubtSessionEntity(
                id=uuid.uuid4(),
                classroom_session_id=session_id,
                topic_id=classroom_session.current_topic_id,
                generation_id=classroom_session.generation_id,
                status=DoubtSessionStatus.ACTIVE,
                topic_context=topic_context,
            )
            created_session = self.unit_of_work.doubt_session_repository.create(doubt_session_entity)
        return DoubtSessionResponseDTO.from_entity(created_session)

    @validate_call(validate_return=True)
    def get_doubt_session(self, doubt_session_id: UUID) -> DoubtSessionDetailResponseDTO:
        with self.unit_of_work:
            doubt_session = self.unit_of_work.doubt_session_repository.find_by_id(doubt_session_id)
            if doubt_session is None:
                raise DoubtSessionNotFoundException(f"Doubt session {doubt_session_id} not found")
            messages = self.unit_of_work.doubt_session_repository.find_messages_by_session(doubt_session_id)
        return DoubtSessionDetailResponseDTO.from_entity_with_messages(doubt_session, messages)

    @validate_call(validate_return=True)
    def ask_doubt(self, doubt_session_id: UUID, request_dto: DoubtMessageRequestDTO) -> DoubtMessageResponseDTO:
        with self.unit_of_work:
            doubt_session = self.unit_of_work.doubt_session_repository.find_by_id(doubt_session_id)
            if doubt_session is None:
                raise DoubtSessionNotFoundException(f"Doubt session {doubt_session_id} not found")
            if doubt_session.status != DoubtSessionStatus.ACTIVE:
                raise ValidationException("Doubt session is not active")
            if request_dto.student_message.strip() == "":
                raise ValidationException("student_message cannot be empty")
            prior_messages = self.unit_of_work.doubt_session_repository.find_messages_by_session(doubt_session_id)
            conversation_history = [
                {"student_message": message.student_message, "ai_response": message.ai_response}
                for message in prior_messages
            ]
            ai_response = self.gemini_doubt_client.resolve_doubt(
                doubt_session.topic_context,
                conversation_history,
                request_dto.student_message,
            )
            message_entity = DoubtMessageEntity(
                id=uuid.uuid4(),
                doubt_session_id=doubt_session_id,
                order=len(prior_messages) + 1,
                student_message=request_dto.student_message,
                ai_response=ai_response,
            )
            created_message = self.unit_of_work.doubt_session_repository.create_message(message_entity)
        return DoubtMessageResponseDTO.from_entity(created_message)

    @validate_call(validate_return=True)
    def close_doubt_session(self, doubt_session_id: UUID) -> CurrentStateResponseDTO:
        with self.unit_of_work:
            doubt_session = self.unit_of_work.doubt_session_repository.find_by_id(doubt_session_id)
            if doubt_session is None:
                raise DoubtSessionNotFoundException(f"Doubt session {doubt_session_id} not found")
            doubt_session.status = DoubtSessionStatus.CLOSED
            doubt_session.closed_at = datetime.now(UTC)
            self.unit_of_work.doubt_session_repository.update(doubt_session)
            classroom_session_id = doubt_session.classroom_session_id
        return self.classroom_session_service.advance_session(classroom_session_id)

    @validate_call(validate_return=True)
    def _build_topic_context(self, session_id: UUID, generation_id: UUID, topic_id: UUID) -> dict:
        generation = self.unit_of_work.live_class_repository.find_generation_by_id(generation_id)
        class_plan = self.unit_of_work.class_plan_repository.find_by_id(generation.class_plan_id)
        topic = next(topic_item for topic_item in class_plan.topics if topic_item.id == topic_id)
        slides = self.unit_of_work.live_class_repository.find_slides_by_state(generation_id, topic_id, "explain")
        quiz_attempts = self.unit_of_work.classroom_session_repository.find_quiz_attempts_by_session_and_topic(
            session_id, generation_id, topic_id
        )
        return {
            "topic_title": topic.title,
            "base_material": topic.base_material,
            "slides": [slide.model_dump(mode="json") for slide in slides],
            "quiz_attempts": [attempt.model_dump(mode="json") for attempt in quiz_attempts],
        }
