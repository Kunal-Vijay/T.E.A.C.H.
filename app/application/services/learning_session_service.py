from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from pydantic import validate_call

from app.application.dtos.learning_session.learning_session_dto import (
    LearningSessionResponseDTO,
    RubricScoreDTO,
    StartLearningSessionRequestDTO,
    SubmitTurnRequestDTO,
    VivaAdvanceRequestDTO,
    VoiceVivaAssessmentDTO,
    VoiceVivaPromptDTO,
)
from app.config import settings
from app.application.dtos.student.student_profile_dto import StudentParamsOverrideDTO
from app.domain.entities import (
    LearningSessionEntity,
    SessionQuizAttemptEntity,
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
    ILLMPopQuizClient,
    ILLMTeachClient,
    ILLMVivaClient,
    IUnitOfWork,
)
from app.domain.student_params import (
    StudentParamOverrides,
    StudentParamsSnapshot,
    default_student_params,
    merge_student_params,
)
from app.domain.viva_turn_classifier import is_substantive_answer
from app.infrastructure.bedrock.bedrock_viva_assessment_client import BedrockVivaAssessmentClient
from app.infrastructure.bedrock.viva_voice_prompt import (
    build_voice_viva_kickoff,
    build_voice_viva_system_prompt,
)


logger = logging.getLogger(__name__)


class LearningSessionService:
    def __init__(
        self,
        unit_of_work: IUnitOfWork,
        teach_client: ILLMTeachClient,
        doubt_client: ILLMInteractiveDoubtClient,
        pop_quiz_client: ILLMPopQuizClient,
        viva_client: ILLMVivaClient,
        viva_assessment_client: BedrockVivaAssessmentClient | None = None,
    ) -> None:
        self.unit_of_work = unit_of_work
        self.teach_client = teach_client
        self.doubt_client = doubt_client
        self.pop_quiz_client = pop_quiz_client
        self.viva_client = viva_client
        # Defaulted so existing call sites keep working; the voice viva is the only
        # thing that needs it.
        self.viva_assessment_client = viva_assessment_client or BedrockVivaAssessmentClient()

    @validate_call(validate_return=True)
    def start_session(self, request_dto: StartLearningSessionRequestDTO) -> LearningSessionResponseDTO:
        with self.unit_of_work:
            topic = self._require_published_topic(request_dto.topic_id)
            params_snapshot = self._resolve_params(
                request_dto.student_identifier,
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

            # Viva is conducted by voice: Nova Sonic opens the conversation itself
            # over the WebSocket. Pre-generating a text turn here would write a tutor
            # question into session_turns that was never actually spoken, and would
            # count it as question 1 before the student has heard anything. It also
            # costs a text-model round trip that is then discarded, so skip it.
            if created.mode == LearningMode.VIVA:
                return LearningSessionResponseDTO.from_entity(created, None)

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
        if session.mode == LearningMode.POP_QUIZ:
            self._apply_pop_quiz_state(session, agent_response, student_message)
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
                return {
                    "tutor_message": f"Ask me any doubt about {topic.title}.",
                    "explanation_text": (
                        f"I am ready to help with doubts and problems on {topic.title}. "
                        "Share your question whenever you are ready."
                    ),
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
        if session.mode == LearningMode.POP_QUIZ:
            return self.pop_quiz_client.generate_pop_quiz_turn(
                topic=topic,
                params=session.params_snapshot,
                conversation_history=conversation_history,
                mode_state=session.mode_state,
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
        explanation_text = (
            str(agent_response["explanation_text"]) if "explanation_text" in agent_response else ""
        )
        quiz_payload = None
        if session.mode == LearningMode.POP_QUIZ:
            quiz_payload = {
                "phase": agent_response["phase"] if "phase" in agent_response else None,
                "question_text": agent_response["question_text"] if "question_text" in agent_response else None,
                "options": agent_response["options"] if "options" in agent_response else [],
            }
        visual = SessionVisualEntity(
            id=uuid.uuid4(),
            learning_session_id=session.id,
            session_turn_id=tutor_turn_id,
            slides=slides,
            explanation_text=explanation_text,
            quiz_payload=quiz_payload,
        )
        return self.unit_of_work.learning_session_repository.create_visual(visual)

    def _apply_pop_quiz_state(
        self,
        session: LearningSessionEntity,
        agent_response: dict,
        student_message: str | None,
    ) -> None:
        questions_asked = (
            int(agent_response["questions_asked"]) if "questions_asked" in agent_response else 0
        )
        phase = str(agent_response["phase"]) if "phase" in agent_response else "ask_question"
        awaiting_answer = phase == "ask_question"
        session.mode_state = {
            **session.mode_state,
            "questions_asked": questions_asked,
            "awaiting_answer": awaiting_answer,
            "phase": phase,
        }
        if phase == "explain_attempt" and student_message is not None:
            attempt_order = questions_asked
            is_correct = None
            if "selected_option_is_correct" in agent_response:
                is_correct = agent_response["selected_option_is_correct"]
            self.unit_of_work.learning_session_repository.create_quiz_attempt(
                SessionQuizAttemptEntity(
                    id=uuid.uuid4(),
                    learning_session_id=session.id,
                    question_text=str(
                        agent_response["question_text"] if "question_text" in agent_response else ""
                    ),
                    selected_option_id=None,
                    student_answer_text=student_message,
                    is_correct=is_correct if isinstance(is_correct, bool) else None,
                    explanation_text=str(
                        agent_response["explanation_text"] if "explanation_text" in agent_response else ""
                    ),
                    order=attempt_order if attempt_order > 0 else 1,
                )
            )
        return None

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
        overrides = None
        if overrides_dto is not None:
            overrides = StudentParamOverrides.model_validate(overrides_dto.model_dump())
        return merge_student_params(profile.attributes, overrides)

    # --- Voice viva (Amazon Nova Sonic speech-to-speech) ---------------------
    # The voice viva bypasses the per-turn LLM round trip that submit_turn uses:
    # Nova Sonic holds the conversation itself over a long-lived stream. These
    # methods give the WebSocket relay what it needs at the start, and record the
    # result at the end, so the session still lands in the same tables as the
    # text-based modes.

    @validate_call(validate_return=True)
    def build_voice_viva_prompt(self, session_id: uuid.UUID) -> VoiceVivaPromptDTO:
        """Assemble the Nova Sonic system prompt for an active viva session."""
        with self.unit_of_work:
            session = self._require_active_session(session_id)
            if session.mode != LearningMode.VIVA:
                raise ValidationException("Voice viva is only available in viva mode")
            topic = self._require_published_topic(session.topic_id)
            weak_ids = (
                [str(item_id) for item_id in session.mode_state["weak_toc_item_ids"]]
                if "weak_toc_item_ids" in session.mode_state
                else []
            )
            system_prompt = build_voice_viva_system_prompt(topic, session.params_snapshot, weak_ids)
        return VoiceVivaPromptDTO(
            session_id=session_id,
            topic_id=topic.id,
            topic_title=topic.title,
            system_prompt=system_prompt,
            kickoff=build_voice_viva_kickoff(),
            max_questions=settings.VIVA_MAX_QUESTIONS,
            max_seconds=settings.VIVA_MAX_SECONDS,
        )

    @validate_call(validate_return=False)
    def record_voice_viva_turns(
        self,
        session_id: uuid.UUID,
        turns: list[tuple[str, str]],
    ) -> None:
        """Persist a finished voice viva's transcript into session_turns.

        Nova Sonic streams the conversation directly, so nothing is written while it
        is in progress. Recording once at the end keeps the transcript in the same
        place as every other mode, which is what the session detail view reads.
        """
        if len(turns) == 0:
            return None
        with self.unit_of_work:
            session = self._require_session(session_id)
            existing = self.unit_of_work.learning_session_repository.find_turns_by_session(session_id)
            next_order = len(existing) + 1
            for role_name, text in turns:
                if text.strip() == "":
                    continue
                role = (
                    SessionTurnRole.STUDENT
                    if role_name.upper() == "USER"
                    else SessionTurnRole.TUTOR
                )
                self.unit_of_work.learning_session_repository.create_turn(
                    SessionTurnEntity(
                        id=uuid.uuid4(),
                        learning_session_id=session.id,
                        order=next_order,
                        role=role,
                        text=text.strip(),
                        input_channel=InputChannel.SPEECH,
                    )
                )
                next_order += 1
        return None

    @validate_call(validate_return=True)
    def complete_voice_viva(
        self,
        session_id: uuid.UUID,
        transcript: list[tuple[str, str]],
        questions_asked: int,
        questions_answered: int,
    ) -> VoiceVivaAssessmentDTO:
        """Grade a finished voice viva and close the session out.

        Writes the rubric into viva_assessments.question_evaluations so it survives a
        page reload and is visible to a teacher, without needing a new table.
        """
        substantive = [
            text for role, text in transcript if role.upper() == "USER" and is_substantive_answer(text)
        ]
        if len(substantive) == 0:
            raise ValidationException(
                "You did not answer any questions, so there is nothing to assess yet"
            )

        with self.unit_of_work:
            session = self._require_session(session_id)
            topic = self._require_published_topic(session.topic_id)
            transcript_text = "\n".join(
                f"{'Student' if role.upper() == 'USER' else 'Examiner'}: {text.strip()}"
                for role, text in transcript
                if text.strip() != ""
            )

            assessment = self.viva_assessment_client.assess_viva(
                topic=topic,
                transcript_text=transcript_text,
                questions_asked=questions_asked,
                questions_answered=questions_answered,
            )

            existing = session.viva_assessment
            self.unit_of_work.learning_session_repository.upsert_viva_assessment(
                VivaAssessmentEntity(
                    id=existing.id if existing is not None else uuid.uuid4(),
                    learning_session_id=session.id,
                    weak_toc_item_ids=assessment["weak_toc_item_ids"],
                    insight_summary=assessment["headline"],
                    # The rubric and narrative live here so no migration is needed.
                    question_evaluations=[
                        {"kind": "rubric", **entry} for entry in assessment["rubric"]
                    ]
                    + [
                        {"kind": "understood_well", "text": item}
                        for item in assessment["understood_well"]
                    ]
                    + [{"kind": "needs_work", "text": item} for item in assessment["needs_work"]]
                    + [
                        {"kind": "misconception", "text": item}
                        for item in assessment["misconceptions"]
                    ]
                    + [{"kind": "next_step", "text": item} for item in assessment["next_steps"]]
                    + [
                        {
                            "kind": "summary",
                            "grasp_level": assessment["grasp_level"],
                            "overall_score": assessment["overall_score"],
                            "questions_asked": questions_asked,
                            "questions_answered": questions_answered,
                        }
                    ],
                )
            )

            session.mode_state = {
                **session.mode_state,
                "questions_asked": questions_asked,
                "questions_answered": questions_answered,
                "weak_toc_item_ids": assessment["weak_toc_item_ids"],
                "next_action": "complete",
                "grasp_level": assessment["grasp_level"],
                "overall_score": assessment["overall_score"],
            }
            session.goal_status = GoalStatus.COMPLETED
            session.status = LearningSessionStatus.COMPLETED
            session.completed_at = datetime.now(timezone.utc)
            self.unit_of_work.learning_session_repository.update(session)

        logger.info(
            "Voice viva completed session_id=%s grasp=%s score=%s answered=%s/%s",
            session_id,
            assessment["grasp_level"],
            assessment["overall_score"],
            questions_answered,
            questions_asked,
        )
        return VoiceVivaAssessmentDTO(
            session_id=session_id,
            topic_title=topic.title,
            grasp_level=assessment["grasp_level"],
            headline=assessment["headline"],
            overall_score=assessment["overall_score"],
            rubric=[RubricScoreDTO.model_validate(entry) for entry in assessment["rubric"]],
            understood_well=assessment["understood_well"],
            needs_work=assessment["needs_work"],
            misconceptions=assessment["misconceptions"],
            next_steps=assessment["next_steps"],
            weak_toc_item_ids=assessment["weak_toc_item_ids"],
            questions_asked=questions_asked,
            questions_answered=questions_answered,
        )

    @validate_call(validate_return=True)
    def get_stored_voice_viva_assessment(self, session_id: uuid.UUID) -> VoiceVivaAssessmentDTO:
        """Rebuild a previously graded viva result from viva_assessments.

        The rubric and narrative were flattened into question_evaluations with a
        "kind" discriminator, so unpack them back into their buckets here.
        """
        with self.unit_of_work:
            session = self._require_session(session_id)
            topic = self.unit_of_work.topic_repository.find_by_id(session.topic_id)
            assessment = session.viva_assessment
        if assessment is None:
            raise ValidationException("This viva has not been marked yet")

        rubric: list[RubricScoreDTO] = []
        buckets: dict[str, list[str]] = {
            "understood_well": [],
            "needs_work": [],
            "misconception": [],
            "next_step": [],
        }
        grasp_level = "partial"
        overall_score = 0
        questions_asked = 0
        questions_answered = 0

        for entry in assessment.question_evaluations:
            if not isinstance(entry, dict):
                continue
            kind = str(entry.get("kind", ""))
            if kind == "rubric":
                with_defaults = {
                    "key": str(entry.get("key", "")),
                    "label": str(entry.get("label", "")),
                    "score": int(entry.get("score", 0)),
                    "max_score": int(entry.get("max_score", 5)),
                    "comment": str(entry.get("comment", "")),
                }
                rubric.append(RubricScoreDTO.model_validate(with_defaults))
            elif kind in buckets:
                text = str(entry.get("text", "")).strip()
                if text != "":
                    buckets[kind].append(text)
            elif kind == "summary":
                grasp_level = str(entry.get("grasp_level", grasp_level))
                overall_score = int(entry.get("overall_score", 0))
                questions_asked = int(entry.get("questions_asked", 0))
                questions_answered = int(entry.get("questions_answered", 0))

        return VoiceVivaAssessmentDTO(
            session_id=session_id,
            topic_title=topic.title if topic is not None else "",
            grasp_level=grasp_level,
            headline=assessment.insight_summary,
            overall_score=overall_score,
            rubric=rubric,
            understood_well=buckets["understood_well"],
            needs_work=buckets["needs_work"],
            misconceptions=buckets["misconception"],
            next_steps=buckets["next_step"],
            weak_toc_item_ids=assessment.weak_toc_item_ids,
            questions_asked=questions_asked,
            questions_answered=questions_answered,
        )

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
        if mode == LearningMode.POP_QUIZ:
            return {
                "questions_asked": 0,
                "awaiting_answer": False,
                "target_questions": 5,
                "phase": "ask_question",
            }
        if mode == LearningMode.VIVA:
            return {
                "questions_asked": 0,
                # Matches the voice viva's own limit so the stored state agrees with
                # what the student is actually told on screen.
                "target_questions": settings.VIVA_MAX_QUESTIONS,
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
            slides.append(
                SessionSlideEntity(
                    slide_id=str(slide["slide_id"]) if "slide_id" in slide else str(uuid.uuid4()),
                    layout=str(slide["layout"]) if "layout" in slide else "title_content",
                    elements=elements,
                )
            )
        return slides

    def _viva_advance_message(self, reason: VivaAdvanceReason) -> str:
        if reason == VivaAdvanceReason.PASS:
            return "pass"
        if reason == VivaAdvanceReason.DONT_KNOW:
            return "I don't know"
        return "(long silence)"
