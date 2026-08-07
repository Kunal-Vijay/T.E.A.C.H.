from __future__ import annotations

import uuid
from datetime import datetime, timezone

from pydantic import validate_call

from app.application.dtos.learning_session.learning_session_dto import (
    LearningSessionResponseDTO,
    StartLearningSessionRequestDTO,
    SubmitTurnRequestDTO,
    VivaAdvanceRequestDTO,
)
from app.application.dtos.student.student_profile_dto import StudentParamsOverrideDTO
from app.domain.entities import (
    LearningSessionEntity,
    SessionSlideElementEntity,
    SessionSlideEntity,
    SessionTurnEntity,
    SessionVisualEntity,
    StudentProfileEntity,
    TopicEntity,
    VivaAssessmentEntity,
)
from app.domain.enums import (
    GoalStatus,
    InputChannel,
    LearningMode,
    LearningSessionStatus,
    SessionTurnRole,
    TopicStatus,
    VivaAdvanceReason,
)
from app.domain.exceptions import (
    LearningSessionNotActiveException,
    LearningSessionNotFoundException,
    TopicNotFoundException,
    ValidationException,
)
from app.domain.interfaces import (
    ILLMInteractiveDoubtClient,
    ILLMTeachClient,
    ILLMVivaClient,
    IUnitOfWork,
)
from app.domain.student_params import (
    StudentParamOverrides,
    StudentParamsSnapshot,
    default_student_params,
    merge_student_params,
    validate_overrides_for_mode,
)


class LearningSessionService:
    def __init__(
        self,
        unit_of_work: IUnitOfWork,
        teach_client: ILLMTeachClient,
        doubt_client: ILLMInteractiveDoubtClient,
        viva_client: ILLMVivaClient,
    ) -> None:
        self.unit_of_work = unit_of_work
        self.teach_client = teach_client
        self.doubt_client = doubt_client
        self.viva_client = viva_client

    @validate_call(validate_return=True)
    def start_session(self, request_dto: StartLearningSessionRequestDTO) -> LearningSessionResponseDTO:
        with self.unit_of_work:
            topic = self._require_published_topic(request_dto.topic_id)
            params_snapshot = self._resolve_params(
                request_dto.student_identifier,
                request_dto.mode,
                request_dto.param_overrides,
            )
            session_entity = LearningSessionEntity(
                id=uuid.uuid4(),
                topic_id=topic.id,
                mode=request_dto.mode,
                student_identifier=request_dto.student_identifier,
                params_snapshot=params_snapshot,
                status=LearningSessionStatus.ACTIVE,
                goal_status=GoalStatus.IN_PROGRESS,
                taught_toc_item_ids=[],
                mode_state=self._initial_mode_state(request_dto.mode),
            )
            created = self.unit_of_work.learning_session_repository.create(session_entity)
            return self._generate_and_apply_tutor_turn(
                session=created,
                topic=topic,
                student_message=None,
                channel=None,
                advance_reason=None,
            )

    @validate_call(validate_return=True)
    def get_session(self, session_id: uuid.UUID) -> LearningSessionResponseDTO:
        with self.unit_of_work:
            session = self._require_session(session_id)
            latest_visual = self.unit_of_work.learning_session_repository.find_latest_visual(session_id)
        return LearningSessionResponseDTO.from_entity(session, latest_visual)

    @validate_call(validate_return=True)
    def submit_turn(
        self,
        session_id: uuid.UUID,
        request_dto: SubmitTurnRequestDTO,
    ) -> LearningSessionResponseDTO:
        with self.unit_of_work:
            session = self._require_active_session(session_id)
            topic = self._require_published_topic(session.topic_id)
            return self._generate_and_apply_tutor_turn(
                session=session,
                topic=topic,
                student_message=request_dto.message,
                channel=request_dto.channel,
                advance_reason=None,
            )

    @validate_call(validate_return=True)
    def advance_viva(
        self,
        session_id: uuid.UUID,
        request_dto: VivaAdvanceRequestDTO,
    ) -> LearningSessionResponseDTO:
        with self.unit_of_work:
            session = self._require_active_session(session_id)
            if session.mode != LearningMode.VIVA:
                raise ValidationException("Viva advance is only valid for viva mode")
            topic = self._require_published_topic(session.topic_id)
            advance_message = self._viva_advance_message(request_dto.reason)
            return self._generate_and_apply_tutor_turn(
                session=session,
                topic=topic,
                student_message=advance_message,
                channel=InputChannel.SPEECH,
                advance_reason=request_dto.reason,
            )

    @validate_call(validate_return=True)
    def abandon_session(self, session_id: uuid.UUID) -> LearningSessionResponseDTO:
        with self.unit_of_work:
            session = self._require_session(session_id)
            session.status = LearningSessionStatus.ABANDONED
            session.completed_at = datetime.now(timezone.utc)
            updated = self.unit_of_work.learning_session_repository.update(session)
            latest_visual = self.unit_of_work.learning_session_repository.find_latest_visual(session_id)
        return LearningSessionResponseDTO.from_entity(updated, latest_visual)

    def _generate_and_apply_tutor_turn(
        self,
        session: LearningSessionEntity,
        topic: TopicEntity,
        student_message: str | None,
        channel: InputChannel | None,
        advance_reason: VivaAdvanceReason | None,
    ) -> LearningSessionResponseDTO:
        turns = self.unit_of_work.learning_session_repository.find_turns_by_session(session.id)
        next_order = len(turns) + 1
        if student_message is not None and student_message.strip() != "":
            student_turn = SessionTurnEntity(
                id=uuid.uuid4(),
                learning_session_id=session.id,
                order=next_order,
                role=SessionTurnRole.STUDENT,
                text=student_message,
                input_channel=channel if channel is not None else InputChannel.CHAT,
            )
            self.unit_of_work.learning_session_repository.create_turn(student_turn)
            next_order += 1
            turns = turns + [student_turn]

        history = [
            {"role": turn.role.value, "text": turn.text}
            for turn in sorted(turns, key=lambda item: item.order)
        ]
        agent_response = self._invoke_mode_agent(
            session=session,
            topic=topic,
            conversation_history=history,
            student_message=student_message,
            advance_reason=advance_reason,
        )
        tutor_text = str(agent_response["tutor_message"]) if "tutor_message" in agent_response else ""
        tutor_turn = SessionTurnEntity(
            id=uuid.uuid4(),
            learning_session_id=session.id,
            order=next_order,
            role=SessionTurnRole.TUTOR,
            text=tutor_text,
            input_channel=None,
        )
        created_tutor_turn = self.unit_of_work.learning_session_repository.create_turn(tutor_turn)

        current_visual = None
        if session.mode != LearningMode.VIVA:
            current_visual = self._persist_visual(session, created_tutor_turn.id, agent_response)

        if session.mode == LearningMode.TEACH:
            taught_ids = agent_response["taught_toc_item_ids"] if "taught_toc_item_ids" in agent_response else []
            session.taught_toc_item_ids = [str(item_id) for item_id in taught_ids]
        if session.mode == LearningMode.VIVA:
            self._apply_viva_state(session, agent_response)

        is_goal_complete = bool(agent_response["is_goal_complete"]) if "is_goal_complete" in agent_response else False
        if is_goal_complete is True:
            session.goal_status = GoalStatus.COMPLETED
            session.status = LearningSessionStatus.COMPLETED
            session.completed_at = datetime.now(timezone.utc)

        updated = self.unit_of_work.learning_session_repository.update(session)
        refreshed = self.unit_of_work.learning_session_repository.find_by_id(updated.id)
        if refreshed is None:
            raise LearningSessionNotFoundException(f"Learning session {session.id} not found after update")
        return LearningSessionResponseDTO.from_entity(refreshed, current_visual)

    def _invoke_mode_agent(
        self,
        session: LearningSessionEntity,
        topic: TopicEntity,
        conversation_history: list[dict],
        student_message: str | None,
        advance_reason: VivaAdvanceReason | None,
    ) -> dict:
        if session.mode == LearningMode.TEACH:
            return self.teach_client.generate_teach_turn(
                topic=topic,
                params=session.params_snapshot,
                conversation_history=conversation_history,
                taught_toc_item_ids=session.taught_toc_item_ids,
                student_message=student_message,
            )
        if session.mode == LearningMode.DOUBT:
            if student_message is None or student_message.strip() == "":
                welcome_text = (
                    f"I am ready to help with doubts and problems on {topic.title}. "
                    "Share your question whenever you are ready."
                )
                return {
                    "tutor_message": f"Ask me any doubt about {topic.title}.",
                    "slides": [
                        {
                            "slide_id": str(uuid.uuid4()),
                            "layout": "title_content",
                            "elements": [
                                {
                                    "element_id": str(uuid.uuid4()),
                                    "type": "heading",
                                    "content": "Doubt mode",
                                },
                                {
                                    "element_id": str(uuid.uuid4()),
                                    "type": "text",
                                    "content": f"Ask anything about {topic.title}",
                                },
                            ],
                            "explanation_text": welcome_text,
                        }
                    ],
                    "is_goal_complete": False,
                }
            return self.doubt_client.generate_doubt_turn(
                topic=topic,
                params=session.params_snapshot,
                conversation_history=conversation_history,
                student_message=student_message,
            )
        if session.mode == LearningMode.VIVA:
            return self.viva_client.generate_viva_turn(
                topic=topic,
                params=session.params_snapshot,
                conversation_history=conversation_history,
                mode_state=session.mode_state,
                student_message=student_message,
                advance_reason=advance_reason,
            )
        raise ValidationException(f"Unsupported learning mode: {session.mode}")

    def _persist_visual(
        self,
        session: LearningSessionEntity,
        tutor_turn_id: uuid.UUID,
        agent_response: dict,
    ) -> SessionVisualEntity:
        slides = self._parse_slides(agent_response["slides"] if "slides" in agent_response else [])
        slide_explanations = [
            slide.explanation_text.strip()
            for slide in slides
            if slide.explanation_text.strip() != ""
        ]
        fallback_explanation = (
            str(agent_response["explanation_text"]) if "explanation_text" in agent_response else ""
        )
        explanation_text = (
            "\n\n".join(slide_explanations)
            if len(slide_explanations) > 0
            else fallback_explanation
        )
        visual = SessionVisualEntity(
            id=uuid.uuid4(),
            learning_session_id=session.id,
            session_turn_id=tutor_turn_id,
            slides=slides,
            explanation_text=explanation_text,
            quiz_payload=None,
        )
        return self.unit_of_work.learning_session_repository.create_visual(visual)

    def _apply_viva_state(self, session: LearningSessionEntity, agent_response: dict) -> None:
        questions_asked = (
            int(agent_response["questions_asked"]) if "questions_asked" in agent_response else 0
        )
        weak_ids = (
            [str(item_id) for item_id in agent_response["weak_toc_item_ids"]]
            if "weak_toc_item_ids" in agent_response
            else []
        )
        evaluations = list(session.mode_state["question_evaluations"]) if "question_evaluations" in session.mode_state else []
        evaluation_text = (
            str(agent_response["evaluation_of_previous"])
            if "evaluation_of_previous" in agent_response
            else ""
        )
        if evaluation_text.strip() != "":
            evaluations = evaluations + [
                {
                    "question": agent_response["question"] if "question" in agent_response else "",
                    "evaluation": evaluation_text,
                }
            ]
        session.mode_state = {
            **session.mode_state,
            "questions_asked": questions_asked,
            "weak_toc_item_ids": weak_ids,
            "next_action": agent_response["next_action"] if "next_action" in agent_response else "ask",
            "question_evaluations": evaluations,
        }
        insight_summary = (
            str(agent_response["insight_summary"]) if "insight_summary" in agent_response else ""
        )
        is_goal_complete = (
            bool(agent_response["is_goal_complete"]) if "is_goal_complete" in agent_response else False
        )
        if insight_summary.strip() != "" or is_goal_complete is True:
            existing = session.viva_assessment
            assessment_id = existing.id if existing is not None else uuid.uuid4()
            self.unit_of_work.learning_session_repository.upsert_viva_assessment(
                VivaAssessmentEntity(
                    id=assessment_id,
                    learning_session_id=session.id,
                    weak_toc_item_ids=weak_ids,
                    insight_summary=insight_summary,
                    question_evaluations=evaluations,
                )
            )
        return None

    def _resolve_params(
        self,
        student_identifier: str,
        mode: LearningMode,
        overrides_dto: StudentParamsOverrideDTO | None,
    ) -> StudentParamsSnapshot:
        profile = self.unit_of_work.student_profile_repository.find_by_student_identifier(
            student_identifier
        )
        if profile is None:
            profile = self.unit_of_work.student_profile_repository.upsert(
                StudentProfileEntity(
                    id=uuid.uuid4(),
                    student_identifier=student_identifier,
                    display_name=None,
                    attributes=default_student_params(),
                )
            )
        if mode == LearningMode.VIVA:
            return merge_student_params(profile.attributes, None, mode)
        overrides = None
        if overrides_dto is not None:
            overrides = StudentParamOverrides.model_validate(overrides_dto.model_dump())
            validate_overrides_for_mode(overrides, mode)
        return merge_student_params(profile.attributes, overrides, mode)

    def _require_published_topic(self, topic_id: uuid.UUID) -> TopicEntity:
        topic = self.unit_of_work.topic_repository.find_by_id(topic_id)
        if topic is None:
            raise TopicNotFoundException(f"Topic {topic_id} not found")
        if topic.status != TopicStatus.PUBLISHED:
            raise ValidationException("Only published topics can start a learning session")
        if len(topic.toc_items) == 0:
            raise ValidationException("Topic must have TOC items")
        return topic

    def _require_session(self, session_id: uuid.UUID) -> LearningSessionEntity:
        session = self.unit_of_work.learning_session_repository.find_by_id(session_id)
        if session is None:
            raise LearningSessionNotFoundException(f"Learning session {session_id} not found")
        return session

    def _require_active_session(self, session_id: uuid.UUID) -> LearningSessionEntity:
        session = self._require_session(session_id)
        if session.status != LearningSessionStatus.ACTIVE:
            raise LearningSessionNotActiveException(f"Learning session {session_id} is not active")
        return session

    def _initial_mode_state(self, mode: LearningMode) -> dict:
        if mode == LearningMode.VIVA:
            return {
                "questions_asked": 0,
                "target_questions": 5,
                "weak_toc_item_ids": [],
                "question_evaluations": [],
                "next_action": "ask",
            }
        return {}

    def _parse_slides(self, raw_slides: list) -> list[SessionSlideEntity]:
        slides: list[SessionSlideEntity] = []
        for slide in raw_slides:
            if not isinstance(slide, dict):
                continue
            elements = []
            for element in slide["elements"] if "elements" in slide else []:
                if not isinstance(element, dict):
                    continue
                elements.append(
                    SessionSlideElementEntity(
                        element_id=str(element["element_id"]) if "element_id" in element else str(uuid.uuid4()),
                        type=str(element["type"]) if "type" in element else "text",
                        content=element["content"] if "content" in element else None,
                    )
                )
            slide_explanation = (
                str(slide["explanation_text"]) if "explanation_text" in slide else ""
            )
            slides.append(
                SessionSlideEntity(
                    slide_id=str(slide["slide_id"]) if "slide_id" in slide else str(uuid.uuid4()),
                    layout=str(slide["layout"]) if "layout" in slide else "title_content",
                    elements=elements,
                    explanation_text=slide_explanation,
                )
            )
        return slides

    def _viva_advance_message(self, reason: VivaAdvanceReason) -> str:
        if reason == VivaAdvanceReason.PASS:
            return "pass"
        if reason == VivaAdvanceReason.DONT_KNOW:
            return "I don't know"
        return "(long silence)"
