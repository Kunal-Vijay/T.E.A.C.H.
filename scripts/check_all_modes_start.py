"""Confirm every learning mode can still start a session.

Regression guard for the change that skips the pre-generated tutor turn in viva
mode: every other mode must be unaffected and still get an opening turn.

Usage:
    PYTHONPATH=. ./venv312/bin/python scripts/check_all_modes_start.py
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
from app.infrastructure.bedrock.bedrock_interactive_doubt_client import (  # noqa: E402
    BedrockInteractiveDoubtClient,
)
from app.infrastructure.bedrock.bedrock_teach_client import BedrockTeachClient  # noqa: E402
from app.infrastructure.bedrock.bedrock_viva_client import BedrockVivaClient  # noqa: E402
from app.infrastructure.unit_of_work import UnitOfWork  # noqa: E402

# Viva is the only mode that should open with no turns: the voice examiner asks the
# first question over the WebSocket instead. Derived from the enum so this keeps
# working if modes are added or removed.
EXPECTED_OPENING_TURNS = {
    mode: ("none" if mode == LearningMode.VIVA else "at least one") for mode in LearningMode
}


def main() -> int:
    database_session = SessionFactory()
    service = LearningSessionService(
        unit_of_work=UnitOfWork(database_session),
        teach_client=BedrockTeachClient(),
        doubt_client=BedrockInteractiveDoubtClient(),
        viva_client=BedrockVivaClient(),
    )
    failures: list[str] = []
    try:
        with service.unit_of_work:
            topics, _total = service.unit_of_work.topic_repository.find_all(
                subject=None, status=TopicStatus.PUBLISHED, offset=0, limit=10
            )
        usable = [topic for topic in topics if len(topic.toc_items) > 0]
        if not usable:
            print("FAIL: no published topic with TOC items. Run scripts/seed_demo_topic.py")
            return 1
        topic = usable[0]
        print(f"topic = {topic.title}")
        print()

        for mode, expectation in EXPECTED_OPENING_TURNS.items():
            try:
                response = service.start_session(
                    StartLearningSessionRequestDTO(
                        topic_id=topic.id,
                        mode=mode,
                        student_identifier=f"regress-{uuid.uuid4().hex[:8]}",
                    )
                )
            except Exception as error:  # noqa: BLE001 - report and continue
                failures.append(f"{mode.value} failed to start: {type(error).__name__}: {error}")
                print(f"  FAIL {mode.value:9s} {type(error).__name__}: {str(error)[:70]}")
                continue

            turn_count = len(response.turns)
            if expectation == "none":
                ok = turn_count == 0
            else:
                ok = turn_count >= 1
            if not ok:
                failures.append(
                    f"{mode.value} opened with {turn_count} turn(s), expected {expectation}"
                )
            print(
                f"  {'OK  ' if ok else 'FAIL'} {mode.value:9s} turns={turn_count} "
                f"(expected {expectation})  status={response.status.value}"
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
