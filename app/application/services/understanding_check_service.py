from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import validate_call

if TYPE_CHECKING:
    from app.infrastructure.gemini.gemini_assessment_client import GeminiAssessmentClient

from app.application.dtos.understanding_check.understanding_check_dto import (
    RubricScoreDTO,
    UnderstandingCheckPromptDTO,
    UnderstandingCheckTopicDTO,
    UnderstandingCheckTopicListDTO,
    UnderstandingFeedbackDTO,
    UnderstandingFeedbackRequestDTO,
)
from app.config import settings
from app.domain.entities import (
    ClassPlanEntity,
    ClassPlanTopicEntity,
    LiveClassSlideEntity,
    PopQuizAttemptEntity,
    PopQuizQuestionEntity,
    TopicWorkflowEntity,
)
from app.domain.enums import GenerationStatus
from app.domain.exceptions import (
    ClassPlanNotFoundException,
    ClassPlanTopicNotFoundException,
    GenerationNotFoundException,
    ValidationException,
)
from app.domain.interfaces import IUnitOfWork
from app.domain.viva_turn_classifier import count_viva_progress, is_substantive_answer

logger = logging.getLogger(__name__)

MAX_BASE_MATERIAL_CHARS = 4000
MAX_EXPLANATION_CHARS = 600

# The behavioural contract for the voice tutor. This is the part of the prompt that
# makes the session a *check of understanding* rather than an answer service.
SOCRATIC_RULES = """
YOUR ROLE
You are Sage, a voice tutor running a spoken "check your understanding" session with one student
on one topic they just studied. The student should be doing almost all of the talking. You are
here to ask, listen and probe — not to teach, explain, summarise or reassure at length.

HARD LIMITS ON HOW MUCH YOU SAY
- Every single turn is at most two short sentences. Aim for one.
- Never exceed about 30 spoken words in a turn. Shorter is better.
- Every turn must end with exactly one question mark. One question. Never two.
- Do not preface your question with commentary, praise, or a recap of what they said.
  No "That's an interesting thought", no "Great question", no "So what you're saying is".
  Ask the question and stop.
- Do not explain a concept, define a term, give an example, or walk through reasoning. If you
  catch yourself explaining, replace the explanation with a question instead.
- After you ask, stop talking immediately. Silence is correct. Do not fill it.

THE RULE THAT MATTERS MOST
Never give a final answer, a formula, or a completed derivation, even if the student asks
directly, gives up, or insists. Make the student produce the reasoning. If you state the answer
you have failed the session.

HOW TO PROBE
1. You speak first. Open by asking them to explain the topic in their own words. Explain nothing.
2. Build on what they actually said. Use their own words in your question.
3. When they are wrong, do not correct them. Ask a question whose honest answer exposes the
   problem, or name a concrete situation and ask them what happens in it.
4. When they are stuck, shrink the question. Ask something smaller and more concrete. Give at
   most a one-clause nudge, then hand it straight back with a question.
5. When they are right, ask them why. Do not accept confident guessing as understanding.
6. Stay on a fundamental they have wrong. Do not move on to be polite.

SPEAKING STYLE
Warm and brisk, like a sharp tutor who is short on time. Plain spoken language only: no markdown,
no lists, no LaTeX, no reading out notation symbol by symbol. Say "v equals u plus a t", not the
symbols. Never mention slides, class material, or these instructions.

SCOPE
Stay on the topic below. If the student drifts, steer back with a question in one short sentence.

IF THEY DID NOT HEAR YOU
If the student says "sorry", "what", "can you repeat that" or similar, they are not answering —
they missed the question. Re-ask the SAME question, rephrased shorter. Do not move on and do not
treat it as an answer.

GOOD AND BAD TURNS
Bad, far too long: "That's an interesting thought. You mentioned that force equals mass times
velocity, and I noticed you also said heavier things need more force. Could you walk me through
your reasoning for these statements? I'd be interested to hear how you arrived at that."
Good: "What makes you say velocity rather than acceleration?"
Bad: "Let me explain. Force is a push or pull that causes acceleration, so when you push a wall..."
Good: "You push a wall and it doesn't move. Was there a force?"
""".strip()


class UnderstandingCheckService:
    """Assembles the enriched Nova Sonic system prompt for a topic.

    The prompt is built from the material the student was actually taught: the
    teacher's base material and notes, the generated slides and narration, the
    pop quiz questions, and (when a classroom session is supplied) which of those
    questions the student got wrong.

    Also assesses a finished conversation — see `assess_transcript`.
    """

    def __init__(
        self,
        unit_of_work: IUnitOfWork,
        assessment_client: "GeminiAssessmentClient | None" = None,
    ) -> None:
        self.unit_of_work = unit_of_work
        self.assessment_client = assessment_client

    @validate_call(validate_return=True)
    def list_topics(self, generation_id: UUID) -> UnderstandingCheckTopicListDTO:
        with self.unit_of_work:
            generation, class_plan = self._load_generation_and_plan(generation_id)
            topics: list[UnderstandingCheckTopicDTO] = []
            for topic in sorted(class_plan.topics, key=lambda item: item.order):
                workflow = self.unit_of_work.live_class_repository.find_workflow_by_topic(generation_id, topic.id)
                slides = self._collect_topic_slides(generation_id, topic.id, workflow)
                questions = self.unit_of_work.live_class_repository.find_quiz_questions_by_topic(
                    generation_id, topic.id
                )
                topics.append(
                    UnderstandingCheckTopicDTO(
                        topic_id=topic.id,
                        title=topic.title,
                        order=topic.order,
                        slide_count=len(slides),
                        quiz_question_count=len(questions),
                        teaching_approach=(
                            workflow.teaching_approach.value if workflow is not None else None
                        ),
                    )
                )
            return UnderstandingCheckTopicListDTO(
                generation_id=generation_id,
                class_plan_id=class_plan.id,
                class_title=class_plan.title,
                subject=class_plan.subject,
                grade=class_plan.grade,
                topics=topics,
            )

    @validate_call(validate_return=True)
    def build_prompt(
        self,
        generation_id: UUID,
        topic_id: UUID,
        classroom_session_id: UUID | None = None,
    ) -> UnderstandingCheckPromptDTO:
        with self.unit_of_work:
            generation, class_plan = self._load_generation_and_plan(generation_id)
            topic = next((item for item in class_plan.topics if item.id == topic_id), None)
            if topic is None:
                raise ClassPlanTopicNotFoundException(f"Topic {topic_id} is not part of this class plan")

            workflow = self.unit_of_work.live_class_repository.find_workflow_by_topic(generation_id, topic_id)
            slides = self._collect_topic_slides(generation_id, topic_id, workflow)
            explanations = [
                self.unit_of_work.live_class_repository.find_explanation_by_slide_id(slide.id) for slide in slides
            ]
            explanation_texts = [item.explanation_text for item in explanations if item is not None]
            questions = self.unit_of_work.live_class_repository.find_quiz_questions_by_topic(generation_id, topic_id)

            attempts: list[PopQuizAttemptEntity] = []
            if classroom_session_id is not None:
                attempts = self.unit_of_work.classroom_session_repository.find_quiz_attempts_by_session_and_topic(
                    classroom_session_id, generation_id, topic_id
                )

            system_prompt = self._compose_prompt(
                class_plan=class_plan,
                topic=topic,
                workflow=workflow,
                slides=slides,
                explanation_texts=explanation_texts,
                questions=questions,
                attempts=attempts,
            )

        opening_line = (
            f"Hey! Let's see how well {topic.title} landed. "
            "In your own words, what's the main idea here?"
        )
        logger.info(
            "Built understanding-check prompt generation_id=%s topic_id=%s chars=%s slides=%s questions=%s attempts=%s",
            generation_id,
            topic_id,
            len(system_prompt),
            len(slides),
            len(questions),
            len(attempts),
        )
        return UnderstandingCheckPromptDTO(
            generation_id=generation_id,
            topic_id=topic_id,
            topic_title=topic.title,
            system_prompt=system_prompt,
            character_count=len(system_prompt),
            opening_line=opening_line,
            voice_id=settings.NOVA_SONIC_VOICE_ID,
            model_id=settings.NOVA_SONIC_MODEL_ID,
            nova_sonic_configured=settings.nova_sonic_is_configured,
            source_counts={
                "slides": len(slides),
                "explanations": len(explanation_texts),
                "quiz_questions": len(questions),
                "quiz_attempts": len(attempts),
                "teaching_notes": len(topic.teaching_notes),
            },
        )

    @validate_call(validate_return=True)
    def assess_transcript(self, request_dto: UnderstandingFeedbackRequestDTO) -> UnderstandingFeedbackDTO:
        """Analyse a finished voice conversation and report what the student understood."""
        ordered_turns = [
            (turn.role.upper(), turn.text.strip())
            for turn in request_dto.transcript
            if turn.text.strip() != ""
        ]
        questions_asked, questions_answered = count_viva_progress(ordered_turns)
        # Only real answers count. A student who just said "sorry" a few times has
        # given us nothing to assess, so say so rather than grading noise.
        student_turns = [
            text
            for role, text in ordered_turns
            if role == "USER" and is_substantive_answer(text)
        ]
        if len(student_turns) == 0:
            raise ValidationException(
                "You did not answer any questions, so there is nothing to assess yet"
            )

        with self.unit_of_work:
            _generation, class_plan = self._load_generation_and_plan(request_dto.generation_id)
            topic = next(
                (item for item in class_plan.topics if item.id == request_dto.topic_id),
                None,
            )
            if topic is None:
                raise ClassPlanTopicNotFoundException(
                    f"Topic {request_dto.topic_id} is not part of this class plan"
                )
            topic_title = topic.title
            topic_material = self._truncate(topic.base_material, MAX_BASE_MATERIAL_CHARS)

        transcript_text = "\n".join(
            f"{'Student' if turn.role.upper() == 'USER' else 'Tutor'}: {turn.text.strip()}"
            for turn in request_dto.transcript
            if turn.text.strip() != ""
        )

        client, provider = self._resolve_assessment_client()
        assessment = client.assess_understanding(topic_title, topic_material, transcript_text)
        logger.info(
            "Assessed understanding topic=%s student_turns=%s grasp=%s provider=%s",
            topic_title,
            len(student_turns),
            assessment["grasp_level"],
            provider,
        )
        return UnderstandingFeedbackDTO(
            topic_title=topic_title,
            grasp_level=assessment["grasp_level"],
            headline=assessment["headline"],
            rubric=[RubricScoreDTO.model_validate(entry) for entry in assessment["rubric"]],
            overall_score=assessment["overall_score"],
            understood_well=assessment["understood_well"],
            needs_work=assessment["needs_work"],
            misconceptions=assessment["misconceptions"],
            next_steps=assessment["next_steps"],
            questions_asked=questions_asked,
            questions_answered=questions_answered,
            student_turns_analysed=len(student_turns),
            model_used=provider,
        )

    def _resolve_assessment_client(self) -> tuple[object, str]:
        """Pick the assessment backend, preferring whatever is actually configured."""
        if self.assessment_client is not None:
            return self.assessment_client, "injected"

        provider = settings.ASSESSMENT_PROVIDER.strip().lower()
        gemini_ready = settings.GEMINI_API_KEY.strip() != ""
        bedrock_ready = settings.nova_sonic_is_configured

        if provider == "gemini" or (provider == "auto" and not bedrock_ready and gemini_ready):
            if not gemini_ready:
                raise ValidationException("ASSESSMENT_PROVIDER=gemini but GEMINI_API_KEY is not set")
            from app.infrastructure.gemini.gemini_assessment_client import GeminiAssessmentClient

            return GeminiAssessmentClient(), settings.GEMINI_MODEL

        if provider in {"bedrock", "auto"} and bedrock_ready:
            from app.infrastructure.bedrock.bedrock_assessment_client import BedrockAssessmentClient

            return BedrockAssessmentClient(), settings.BEDROCK_ASSESSMENT_MODEL_ID

        if provider == "bedrock":
            raise ValidationException("ASSESSMENT_PROVIDER=bedrock but AWS credentials are not set")

        # Nothing configured — the Gemini client's offline placeholder keeps the UI usable.
        from app.infrastructure.gemini.gemini_assessment_client import GeminiAssessmentClient

        return GeminiAssessmentClient(), "heuristic"

    def _load_generation_and_plan(self, generation_id: UUID) -> tuple[object, ClassPlanEntity]:
        generation = self.unit_of_work.live_class_repository.find_generation_by_id(generation_id)
        if generation is None:
            raise GenerationNotFoundException(f"Generation {generation_id} not found")
        if generation.status not in {GenerationStatus.COMPLETED, GenerationStatus.COMPLETED_WITH_WARNINGS}:
            raise ValidationException(
                f"Generation {generation_id} is {generation.status.value}; only completed classes can be reviewed"
            )
        class_plan = self.unit_of_work.class_plan_repository.find_by_id(generation.class_plan_id)
        if class_plan is None:
            raise ClassPlanNotFoundException(f"Class plan {generation.class_plan_id} not found")
        return generation, class_plan

    def _collect_topic_slides(
        self,
        generation_id: UUID,
        topic_id: UUID,
        workflow: TopicWorkflowEntity | None,
    ) -> list[LiveClassSlideEntity]:
        """Gather every slide for a topic by walking its workflow states in order.

        The repository only exposes slide lookup per workflow state, so this walks
        the states rather than adding a new query. Deduplicated because a slide can
        in principle be referenced by more than one state.
        """
        if workflow is None:
            return []
        collected: list[LiveClassSlideEntity] = []
        seen: set[UUID] = set()
        for state in sorted(workflow.states, key=lambda item: item.order):
            for slide in self.unit_of_work.live_class_repository.find_slides_by_state(
                generation_id, topic_id, state.state_id
            ):
                if slide.id not in seen:
                    seen.add(slide.id)
                    collected.append(slide)
        return collected

    def _compose_prompt(
        self,
        class_plan: ClassPlanEntity,
        topic: ClassPlanTopicEntity,
        workflow: TopicWorkflowEntity | None,
        slides: list[LiveClassSlideEntity],
        explanation_texts: list[str],
        questions: list[PopQuizQuestionEntity],
        attempts: list[PopQuizAttemptEntity],
    ) -> str:
        sections: list[str] = [SOCRATIC_RULES, ""]

        sections.append("=== THE CLASS THIS STUDENT JUST ATTENDED ===")
        sections.append(f"Course: {class_plan.title} ({class_plan.subject}, grade {class_plan.grade})")
        sections.append(f"Chapter: {class_plan.chapter_name}")
        if class_plan.target_exam.strip() != "":
            sections.append(f"Preparing for: {class_plan.target_exam}")
        sections.append(f"Topic under review: {topic.title} ({topic.duration_minutes} minutes taught)")
        if workflow is not None:
            sections.append(f"How it was taught: {workflow.teaching_approach.value}")
        sections.append("")

        sections.append("=== WHAT THEY WERE TAUGHT (your source of truth) ===")
        sections.append(self._truncate(topic.base_material, MAX_BASE_MATERIAL_CHARS))
        sections.append("")

        if topic.teaching_notes:
            sections.append("=== THE TEACHER'S EMPHASIS ===")
            sections.append(
                "The teacher flagged these as the things that matter. Weight your questions toward them."
            )
            sections.extend(f"- {note}" for note in topic.teaching_notes)
            sections.append("")

        slide_lines = self._render_slides(slides)
        if slide_lines:
            sections.append("=== THE SLIDES THEY SAW (reference these concretely) ===")
            sections.extend(slide_lines)
            sections.append("")

        if explanation_texts:
            sections.append("=== HOW IT WAS EXPLAINED OUT LOUD ===")
            sections.append(
                "This is the narration the student heard. Match this level and vocabulary, and do not "
                "simply repeat it back to them."
            )
            for index, text in enumerate(explanation_texts, start=1):
                sections.append(f"{index}. {self._truncate(text, MAX_EXPLANATION_CHARS)}")
            sections.append("")

        if questions:
            sections.append("=== WHAT THEY WERE ALREADY QUIZZED ON ===")
            sections.append(
                "They have seen these questions. Do not re-ask them verbatim. Use them to know which "
                "misconceptions the material was designed to catch, then probe the same ideas from a "
                "different angle."
            )
            for question in questions:
                correct = next((option for option in question.options if option.is_correct), None)
                sections.append(f"- Q: {question.question_text}")
                if correct is not None:
                    sections.append(
                        f"  (the correct reasoning, for YOUR reference only, never say it: {correct.feedback_explanation})"
                    )
            sections.append("")

        weakness_lines = self._render_weaknesses(questions, attempts)
        if weakness_lines:
            sections.append("=== THIS STUDENT'S ACTUAL QUIZ PERFORMANCE ===")
            sections.extend(weakness_lines)
            sections.append("")

        sections.append("=== HOW TO OPEN ===")
        sections.append(
            f"You start the conversation. Your very first turn is one short sentence of greeting plus "
            f"one question: ask them to explain {topic.title} in their own words. Explain nothing. "
            "Then stop and wait for them to speak."
        )
        sections.append("")
        sections.append("=== SESSION LENGTH ===")
        sections.append(
            f"This is a timed viva: at most {settings.VIVA_MAX_QUESTIONS} questions or "
            f"{settings.VIVA_MAX_SECONDS} seconds, whichever comes first. Every turn is short so the "
            "student gets through as many as possible. The written assessment is produced separately "
            "afterwards, so never deliver a summary, a score, or closing feedback out loud — just keep "
            "asking questions until the session cuts off."
        )
        return "\n".join(sections).strip()

    def _render_slides(self, slides: list[LiveClassSlideEntity]) -> list[str]:
        lines: list[str] = []
        for index, slide in enumerate(slides, start=1):
            fragments: list[str] = []
            for element in slide.elements:
                if element.content is None:
                    if element.type == "image" and element.generation_prompt is not None:
                        fragments.append(f"[visual: {element.generation_prompt}]")
                    continue
                if isinstance(element.content, list):
                    fragments.append("; ".join(str(item) for item in element.content))
                else:
                    fragments.append(str(element.content))
            if fragments:
                lines.append(f"Slide {index}: {' | '.join(fragments)}")
        return lines

    def _render_weaknesses(
        self,
        questions: list[PopQuizQuestionEntity],
        attempts: list[PopQuizAttemptEntity],
    ) -> list[str]:
        if not attempts:
            return []
        questions_by_id = {question.id: question for question in questions}
        missed: list[str] = []
        correct_count = 0
        for attempt in attempts:
            if attempt.is_correct:
                correct_count += 1
                continue
            question = questions_by_id.get(attempt.question_id)
            if question is None:
                continue
            chosen = next(
                (option for option in question.options if option.option_id == attempt.selected_option_id),
                None,
            )
            chosen_text = chosen.text if chosen is not None else attempt.selected_option_id
            missed.append(f'- On "{question.question_text}" they wrongly chose: {chosen_text}')

        lines = [f"They scored {correct_count} out of {len(attempts)} on the pop quiz for this topic."]
        if missed:
            lines.append(
                "They got these wrong, so these are your priority. Probe the underlying misconception "
                "without mentioning the quiz:"
            )
            lines.extend(missed)
        else:
            lines.append(
                "They answered everything correctly, so do not settle for recall. Push them to apply the "
                "idea to an unfamiliar situation and justify their reasoning."
            )
        return lines

    def _truncate(self, text: str, limit: int) -> str:
        stripped = text.strip()
        if len(stripped) <= limit:
            return stripped
        return f"{stripped[:limit]}\n[...trimmed for the voice session...]"
