from __future__ import annotations

import uuid
from uuid import UUID

from pydantic import validate_call

from app.application.dtos.classroom.classroom_session_dto import (
    ClassroomSessionResponseDTO,
    CreateClassroomSessionRequestDTO,
    StudentInputRequestDTO,
)
from app.application.dtos.workflow.current_state_response_dto import CurrentStateResponseDTO
from app.application.services.workflow_navigation_service import WorkflowNavigationService
from app.domain.entities import ClassroomSessionEntity
from app.domain.enums import ClassroomSessionStatus, GenerationStatus, WorkflowStateType
from app.domain.exceptions import (
    ClassroomSessionNotFoundException,
    GenerationNotFoundException,
    InvalidWorkflowStateException,
    ValidationException,
)
from app.domain.interfaces import IUnitOfWork


class ClassroomSessionService:
    def __init__(self, unit_of_work: IUnitOfWork, workflow_navigation_service: WorkflowNavigationService) -> None:
        self.unit_of_work = unit_of_work
        self.workflow_navigation_service = workflow_navigation_service

    @validate_call(validate_return=True)
    def create_session(self, request_dto: CreateClassroomSessionRequestDTO) -> ClassroomSessionResponseDTO:
        with self.unit_of_work:
            generation = self.unit_of_work.live_class_repository.find_generation_by_id(request_dto.generation_id)
            if generation is None:
                raise GenerationNotFoundException(f"Generation {request_dto.generation_id} not found")
            if generation.status not in {GenerationStatus.COMPLETED, GenerationStatus.COMPLETED_WITH_WARNINGS}:
                raise ValidationException("Class generation is not ready yet")
            class_plan = self.unit_of_work.class_plan_repository.find_by_id(generation.class_plan_id)
            if class_plan is None or len(class_plan.topics) == 0:
                raise ValidationException("Class plan has no topics")
            first_topic = sorted(class_plan.topics, key=lambda topic: topic.order)[0]
            first_workflow = self.unit_of_work.live_class_repository.find_workflow_by_topic(
                generation.id, first_topic.id
            )
            if first_workflow is None or len(first_workflow.states) == 0:
                raise ValidationException("Topic workflow is not available")
            first_state = sorted(first_workflow.states, key=lambda state: state.order)[0]
            session_entity = ClassroomSessionEntity(
                id=uuid.uuid4(),
                generation_id=generation.id,
                current_topic_id=first_topic.id,
                current_state_id=first_state.state_id,
                session_status=ClassroomSessionStatus.ACTIVE,
                student_identifier=request_dto.student_identifier,
            )
            created_session = self.unit_of_work.classroom_session_repository.create(session_entity)
        return ClassroomSessionResponseDTO.from_entity(created_session)

    @validate_call(validate_return=True)
    def get_session(self, session_id: UUID) -> ClassroomSessionResponseDTO:
        with self.unit_of_work:
            classroom_session = self.unit_of_work.classroom_session_repository.find_by_id(session_id)
            if classroom_session is None:
                raise ClassroomSessionNotFoundException(f"Classroom session {session_id} not found")
        return ClassroomSessionResponseDTO.from_entity(classroom_session)

    @validate_call(validate_return=True)
    def get_current_state(self, session_id: UUID) -> CurrentStateResponseDTO:
        return self.workflow_navigation_service.build_current_state_response(session_id)

    @validate_call(validate_return=True)
    def advance_session(self, session_id: UUID) -> CurrentStateResponseDTO:
        with self.unit_of_work:
            classroom_session = self.unit_of_work.classroom_session_repository.find_by_id(session_id)
            if classroom_session is None:
                raise ClassroomSessionNotFoundException(f"Classroom session {session_id} not found")
            if classroom_session.current_topic_id is None or classroom_session.current_state_id is None:
                if classroom_session.session_status == ClassroomSessionStatus.COMPLETED:
                    return self.workflow_navigation_service.build_current_state_response(session_id)
                raise InvalidWorkflowStateException("Session has no active workflow state")
            workflow = self.unit_of_work.live_class_repository.find_workflow_by_topic(
                classroom_session.generation_id,
                classroom_session.current_topic_id,
            )
            if workflow is None:
                raise InvalidWorkflowStateException("Workflow not found")
            ordered_states = sorted(workflow.states, key=lambda state: state.order)
            current_index = next(
                index
                for index, state in enumerate(ordered_states)
                if state.state_id == classroom_session.current_state_id
            )
            current_state = ordered_states[current_index]
            if current_state.state_type == WorkflowStateType.STUDENT_PREDICT:
                raise InvalidWorkflowStateException("Submit prediction before advancing")
            if current_index + 1 < len(ordered_states):
                next_state = ordered_states[current_index + 1]
                classroom_session.current_state_id = next_state.state_id
            else:
                classroom_session = self._advance_to_next_topic(classroom_session)
            self.unit_of_work.classroom_session_repository.update(classroom_session)
        return self.workflow_navigation_service.build_current_state_response(session_id)

    @validate_call(validate_return=True)
    def submit_student_input(
        self,
        session_id: UUID,
        request_dto: StudentInputRequestDTO,
    ) -> CurrentStateResponseDTO:
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
            if current_state.state_type != WorkflowStateType.STUDENT_PREDICT:
                raise InvalidWorkflowStateException("Current state does not accept student input")
            if request_dto.prediction_text.strip() == "":
                raise ValidationException("prediction_text cannot be empty")
            ordered_states = sorted(workflow.states, key=lambda state: state.order)
            current_index = next(
                index for index, state in enumerate(ordered_states) if state.state_id == current_state.state_id
            )
            next_state = ordered_states[current_index + 1]
            classroom_session.current_state_id = next_state.state_id
            self.unit_of_work.classroom_session_repository.update(classroom_session)
        return self.workflow_navigation_service.build_current_state_response(session_id)

    @validate_call(validate_return=True)
    def skip_doubts(self, session_id: UUID) -> CurrentStateResponseDTO:
        with self.unit_of_work:
            classroom_session = self.unit_of_work.classroom_session_repository.find_by_id(session_id)
            if classroom_session is None:
                raise ClassroomSessionNotFoundException(f"Classroom session {session_id} not found")
            if classroom_session.current_topic_id is None or classroom_session.current_state_id is None:
                if classroom_session.session_status != ClassroomSessionStatus.COMPLETED:
                    raise InvalidWorkflowStateException("Session has no active workflow state")
            else:
                workflow = self.unit_of_work.live_class_repository.find_workflow_by_topic(
                    classroom_session.generation_id,
                    classroom_session.current_topic_id,
                )
                if workflow is None:
                    raise InvalidWorkflowStateException("Workflow not found")
                current_state = next(
                    (
                        state
                        for state in workflow.states
                        if state.state_id == classroom_session.current_state_id
                    ),
                    None,
                )
                if current_state is None or current_state.state_type != WorkflowStateType.DOUBTS_RESOLUTION:
                    raise InvalidWorkflowStateException("Session is not in doubts resolution state")
                classroom_session = self._advance_to_next_topic(classroom_session)
                self.unit_of_work.classroom_session_repository.update(classroom_session)
        return self.workflow_navigation_service.build_current_state_response(session_id)

    @validate_call(validate_return=True)
    def _advance_to_next_topic(self, classroom_session: ClassroomSessionEntity) -> ClassroomSessionEntity:
        generation = self.unit_of_work.live_class_repository.find_generation_by_id(classroom_session.generation_id)
        if generation is None:
            raise GenerationNotFoundException("Generation not found")
        class_plan = self.unit_of_work.class_plan_repository.find_by_id(generation.class_plan_id)
        if class_plan is None:
            raise ValidationException("Class plan not found")
        ordered_topics = sorted(class_plan.topics, key=lambda topic: topic.order)
        current_topic_index = next(
            index for index, topic in enumerate(ordered_topics) if topic.id == classroom_session.current_topic_id
        )
        if current_topic_index + 1 >= len(ordered_topics):
            classroom_session.session_status = ClassroomSessionStatus.COMPLETED
            classroom_session.current_topic_id = None
            classroom_session.current_state_id = None
            return classroom_session
        next_topic = ordered_topics[current_topic_index + 1]
        next_workflow = self.unit_of_work.live_class_repository.find_workflow_by_topic(
            classroom_session.generation_id,
            next_topic.id,
        )
        if next_workflow is None or len(next_workflow.states) == 0:
            raise InvalidWorkflowStateException("Next topic workflow not found")
        first_state = sorted(next_workflow.states, key=lambda state: state.order)[0]
        classroom_session.current_topic_id = next_topic.id
        classroom_session.current_state_id = first_state.state_id
        return classroom_session
