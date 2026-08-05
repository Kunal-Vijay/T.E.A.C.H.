from __future__ import annotations

import uuid
from uuid import UUID

from pydantic import validate_call

from app.application.dtos.pop_quiz.quiz_attempt_dto import QuizAttemptRequestDTO, QuizAttemptResponseDTO
from app.domain.entities import PopQuizAttemptEntity
from app.domain.enums import WorkflowStateType
from app.domain.exceptions import (
    ClassroomSessionNotFoundException,
    PopQuizQuestionNotFoundException,
    ValidationException,
)
from app.domain.interfaces import IUnitOfWork


class PopQuizService:
    def __init__(self, unit_of_work: IUnitOfWork) -> None:
        self.unit_of_work = unit_of_work

    @validate_call(validate_return=True)
    def submit_attempt(self, session_id: UUID, request_dto: QuizAttemptRequestDTO) -> QuizAttemptResponseDTO:
        with self.unit_of_work:
            classroom_session = self.unit_of_work.classroom_session_repository.find_by_id(session_id)
            if classroom_session is None:
                raise ClassroomSessionNotFoundException(f"Classroom session {session_id} not found")
            workflow = self.unit_of_work.live_class_repository.find_workflow_by_topic(
                classroom_session.generation_id,
                classroom_session.current_topic_id,
            )
            if workflow is None:
                raise ValidationException("Workflow not found")
            current_state = next(
                state for state in workflow.states if state.state_id == classroom_session.current_state_id
            )
            if current_state.state_type != WorkflowStateType.POP_QUIZ:
                raise ValidationException("Session is not in pop quiz state")
            question = self.unit_of_work.live_class_repository.find_quiz_question_by_id(request_dto.question_id)
            if question is None:
                raise PopQuizQuestionNotFoundException(f"Question {request_dto.question_id} not found")
            selected_option = next(
                (
                    option
                    for option in question.options
                    if option.option_id == request_dto.selected_option_id
                ),
                None,
            )
            if selected_option is None:
                raise ValidationException("Selected option not found")
            attempt_entity = PopQuizAttemptEntity(
                id=uuid.uuid4(),
                session_id=session_id,
                question_id=question.id,
                selected_option_id=selected_option.option_id,
                is_correct=selected_option.is_correct,
                feedback_explanation=selected_option.feedback_explanation,
            )
            created_attempt = self.unit_of_work.classroom_session_repository.create_quiz_attempt(attempt_entity)
        return QuizAttemptResponseDTO.from_entity(created_attempt)
