from __future__ import annotations

from uuid import UUID

from pydantic import validate_call

from app.application.dtos.workflow.current_state_response_dto import (
    CurrentSlideDTO,
    CurrentStateContentDTO,
    CurrentStateDTO,
    CurrentStateResponseDTO,
    QuizOptionDTO,
    QuizQuestionDTO,
    SlideExplanationDTO,
    TopicWorkflowResponseDTO,
)
from app.domain.entities import WorkflowStateEntity
from app.domain.enums import WorkflowStateType
from app.domain.exceptions import ClassroomSessionNotFoundException, GenerationNotFoundException
from app.domain.interfaces import IUnitOfWork


class WorkflowNavigationService:
    def __init__(self, unit_of_work: IUnitOfWork) -> None:
        self.unit_of_work = unit_of_work

    @validate_call(validate_return=True)
    def get_topic_workflow(self, generation_id: UUID, topic_id: UUID) -> TopicWorkflowResponseDTO:
        with self.unit_of_work:
            workflow = self.unit_of_work.live_class_repository.find_workflow_by_topic(generation_id, topic_id)
            if workflow is None:
                raise GenerationNotFoundException(f"Workflow not found for topic {topic_id}")
        return TopicWorkflowResponseDTO.from_entity(workflow)

    @validate_call(validate_return=True)
    def build_current_state_response(self, session_id: UUID) -> CurrentStateResponseDTO:
        with self.unit_of_work:
            classroom_session = self.unit_of_work.classroom_session_repository.find_by_id(session_id)
            if classroom_session is None:
                raise ClassroomSessionNotFoundException(f"Classroom session {session_id} not found")
            if classroom_session.current_topic_id is None or classroom_session.current_state_id is None:
                return CurrentStateResponseDTO(
                    session_id=session_id,
                    session_status=classroom_session.session_status.value,
                )
            workflow = self.unit_of_work.live_class_repository.find_workflow_by_topic(
                classroom_session.generation_id,
                classroom_session.current_topic_id,
            )
            if workflow is None:
                raise GenerationNotFoundException("Workflow not found for current topic")
            current_state = next(
                (
                    state
                    for state in workflow.states
                    if state.state_id == classroom_session.current_state_id
                ),
                None,
            )
            if current_state is None:
                return CurrentStateResponseDTO(
                    session_id=session_id,
                    topic_id=classroom_session.current_topic_id,
                    session_status=classroom_session.session_status.value,
                )
            content = self._build_state_content(
                classroom_session.generation_id,
                classroom_session.current_topic_id,
                current_state,
            )
            return CurrentStateResponseDTO(
                session_id=session_id,
                topic_id=classroom_session.current_topic_id,
                current_state=CurrentStateDTO(
                    state_id=current_state.state_id,
                    phase=current_state.phase.value,
                    state_type=current_state.state_type,
                    label=current_state.label,
                    requires_student_input=current_state.requires_student_input,
                ),
                content=content,
                next_advance_trigger=current_state.advance_trigger.value,
                session_status=classroom_session.session_status.value,
            )

    @validate_call(validate_return=True)
    def _build_state_content(
        self,
        generation_id: UUID,
        topic_id: UUID,
        current_state: WorkflowStateEntity,
    ) -> CurrentStateContentDTO:
        if current_state.state_type == WorkflowStateType.POP_QUIZ:
            question_ids = [UUID(question_id) for question_id in current_state.quiz_question_ids]
            quiz_questions = self.unit_of_work.live_class_repository.find_quiz_questions_by_ids(question_ids)
            return CurrentStateContentDTO(
                quiz_questions=[
                    QuizQuestionDTO(
                        question_id=question.id,
                        question_text=question.question_text,
                        options=[
                            QuizOptionDTO(option_id=option.option_id, text=option.text)
                            for option in question.options
                        ],
                    )
                    for question in quiz_questions
                ]
            )
        slides = self.unit_of_work.live_class_repository.find_slides_by_state(
            generation_id, topic_id, current_state.state_id
        )
        current_slides: list[CurrentSlideDTO] = []
        for slide in slides:
            explanation = self.unit_of_work.live_class_repository.find_explanation_by_slide_id(slide.id)
            current_slides.append(
                CurrentSlideDTO(
                    slide_id=slide.id,
                    elements=[element.model_dump() for element in slide.elements],
                    explanation=(
                        SlideExplanationDTO(
                            explanation_text=explanation.explanation_text,
                            duration_seconds=explanation.duration_seconds,
                        )
                        if explanation is not None
                        else None
                    ),
                )
            )
        return CurrentStateContentDTO(slides=current_slides)
