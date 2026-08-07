"""Offline integration checks for the spoken viva.

Exercises everything that does not need a live Bedrock call:
  - starting a viva session does NOT pre-generate a phantom tutor turn
  - the Nova Sonic prompt builds from the topic model
  - the assessment persists into viva_assessments and reads back correctly
  - a filler-only transcript is refused

The assessment path runs through invoke_structured_tool, which falls back to its
mock response when AWS credentials are absent — so this still exercises the
persistence and round-trip logic without network access.

Usage:
    PYTHONPATH=. ./venv312/bin/python scripts/check_viva_voice_integration.py
"""

from __future__ import annotations

import sys
import uuid

from dotenv import load_dotenv

load_dotenv()

from app.application.dtos.learning_session.learning_session_dto import (  # noqa: E402
    StartLearningSessionRequestDTO,
)
from app.application.services.learning_session_service import LearningSessionService  # noqa: E402
from app.core.database import SessionFactory  # noqa: E402
from app.domain.enums import LearningMode, TopicStatus  # noqa: E402
from app.domain.exceptions import ValidationException  # noqa: E402
from app.infrastructure.bedrock.bedrock_interactive_doubt_client import (  # noqa: E402
    BedrockInteractiveDoubtClient,
)
from app.infrastructure.bedrock.bedrock_pop_quiz_client import BedrockPopQuizClient  # noqa: E402
from app.infrastructure.bedrock.bedrock_teach_client import BedrockTeachClient  # noqa: E402
from app.infrastructure.bedrock.bedrock_viva_client import BedrockVivaClient  # noqa: E402
from app.infrastructure.unit_of_work import UnitOfWork  # noqa: E402

REAL_TRANSCRIPT = [
    ("ASSISTANT", "Hello. Can you explain what force is in your own words?"),
    ("USER", "Force is a push or a pull between two objects."),
    ("ASSISTANT", "You push a wall and it doesn't move. Was there a force?"),
    ("USER", "No, because nothing moved."),
    ("ASSISTANT", "What keeps a puck sliding on smooth ice?"),
    ("USER", "You have to keep pushing it. Force equals mass times velocity."),
]

FILLER_ONLY = [
    ("ASSISTANT", "Can you explain what force is?"),
    ("USER", "sorry"),
    ("USER", "what?"),
    ("USER", "can you repeat that"),
]


def build_service(database_session) -> LearningSessionService:
    return LearningSessionService(
        unit_of_work=UnitOfWork(database_session),
        teach_client=BedrockTeachClient(),
        doubt_client=BedrockInteractiveDoubtClient(),
        pop_quiz_client=BedrockPopQuizClient(),
        viva_client=BedrockVivaClient(),
    )


def main() -> int:
    failures: list[str] = []
    database_session = SessionFactory()
    service = build_service(database_session)

    try:
        # Find a published topic to run against.
        with service.unit_of_work:
            topics, _total = service.unit_of_work.topic_repository.find_all(
                subject=None, status=TopicStatus.PUBLISHED, offset=0, limit=20
            )
        usable = [topic for topic in topics if len(topic.toc_items) > 0]
        if not usable:
            print("FAIL: no published topic with TOC items. Run scripts/seed_demo_topic.py")
            return 1
        topic = usable[0]
        print(f"topic = {topic.title} ({len(topic.toc_items)} TOC items)")
        print()

        # 1. Starting a viva must not pre-generate a tutor turn.
        started = service.start_session(
            StartLearningSessionRequestDTO(
                topic_id=topic.id,
                mode=LearningMode.VIVA,
                student_identifier=f"offline-check-{uuid.uuid4().hex[:8]}",
            )
        )
        session_id = started.id
        if len(started.turns) == 0:
            print("PASS  starting a viva creates no phantom tutor turn")
        else:
            failures.append(
                f"start_session created {len(started.turns)} turn(s): "
                f"{[t.text[:40] for t in started.turns]}"
            )
        asked_at_start = started.mode_state.get("questions_asked", 0)
        if asked_at_start == 0:
            print("PASS  questions_asked starts at 0")
        else:
            failures.append(f"questions_asked started at {asked_at_start}, expected 0")
        target = started.mode_state.get("target_questions")
        print(f"      target_questions = {target}")

        # 2. The Nova Sonic prompt builds for this session.
        prompt_dto = service.build_voice_viva_prompt(session_id)
        if topic.title in prompt_dto.system_prompt and prompt_dto.kickoff != "":
            print(f"PASS  voice prompt built ({len(prompt_dto.system_prompt)} chars)")
            print(f"      limits = {prompt_dto.max_questions}Q / {prompt_dto.max_seconds}s")
        else:
            failures.append("voice prompt did not include the topic title or kickoff")

        # 3. A filler-only transcript must be refused, not graded.
        try:
            service.complete_voice_viva(session_id, FILLER_ONLY, 1, 0)
            failures.append("filler-only transcript was graded instead of refused")
        except ValidationException as error:
            print(f'PASS  filler-only refused: "{error}"')

        # 4. A real transcript persists turns and an assessment.
        service.record_voice_viva_turns(session_id, REAL_TRANSCRIPT)
        assessment = service.complete_voice_viva(session_id, REAL_TRANSCRIPT, 3, 3)
        print(f"PASS  graded: {assessment.overall_score}% ({assessment.grasp_level})")
        print(f'      headline: "{assessment.headline[:80]}"')
        print(f"      rubric entries = {len(assessment.rubric)}")

        # 5. Turns landed in session_turns.
        detail = service.get_session(session_id)
        student_turns = [t for t in detail.turns if t.role.value == "student"]
        tutor_turns = [t for t in detail.turns if t.role.value == "tutor"]
        expected_student = len([t for r, t in REAL_TRANSCRIPT if r == "USER"])
        if len(student_turns) == expected_student and len(tutor_turns) > 0:
            print(
                f"PASS  persisted {len(student_turns)} student + {len(tutor_turns)} examiner turns"
            )
        else:
            failures.append(
                f"turn persistence wrong: {len(student_turns)} student "
                f"(expected {expected_student}), {len(tutor_turns)} tutor"
            )
        if all(t.input_channel is not None and t.input_channel.value == "speech" for t in student_turns):
            print("PASS  student turns marked as the speech channel")
        else:
            failures.append("student turns were not marked as speech")

        # 6. The session is closed out.
        if detail.status.value == "completed" and detail.goal_status.value == "completed":
            print("PASS  session closed: status=completed goal=completed")
        else:
            failures.append(
                f"session not closed: status={detail.status.value} goal={detail.goal_status.value}"
            )

        # 7. viva_assessments round-trips, including the rubric.
        if detail.viva_assessment is not None:
            print(f"PASS  viva_assessment persisted ({len(detail.viva_assessment.question_evaluations)} entries)")
        else:
            failures.append("viva_assessment was not persisted")

        reread = service.get_stored_voice_viva_assessment(session_id)
        if (
            reread.grasp_level == assessment.grasp_level
            and reread.overall_score == assessment.overall_score
            and len(reread.rubric) == len(assessment.rubric)
            and reread.misconceptions == assessment.misconceptions
        ):
            print("PASS  stored assessment reads back identically (reload path works)")
        else:
            failures.append(
                "stored assessment did not round-trip: "
                f"grasp {reread.grasp_level} vs {assessment.grasp_level}, "
                f"score {reread.overall_score} vs {assessment.overall_score}, "
                f"rubric {len(reread.rubric)} vs {len(assessment.rubric)}"
            )
    finally:
        database_session.close()

    print()
    for failure in failures:
        print(f"FAIL  {failure}")
    print("RESULT:", "PASS" if not failures else "FAIL")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
