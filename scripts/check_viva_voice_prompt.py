"""Verify the spoken-viva system prompt builds from the new topic model.

Needs no AWS access — it only reads the database and formats a prompt.

Usage:
    PYTHONPATH=. ./venv312/bin/python scripts/check_viva_voice_prompt.py
    PYTHONPATH=. ./venv312/bin/python scripts/check_viva_voice_prompt.py --print
"""

from __future__ import annotations

import argparse
import sys

from dotenv import load_dotenv

load_dotenv()

from app.core.database import SessionFactory  # noqa: E402
from app.domain.enums import TopicStatus  # noqa: E402
from app.domain.student_params import default_student_params  # noqa: E402
from app.infrastructure.bedrock.viva_voice_prompt import (  # noqa: E402
    build_voice_viva_kickoff,
    build_voice_viva_system_prompt,
)
from app.infrastructure.unit_of_work import UnitOfWork  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print", action="store_true", dest="show", help="dump the whole prompt")
    args = parser.parse_args()

    database_session = SessionFactory()
    unit_of_work = UnitOfWork(database_session)
    try:
        with unit_of_work:
            topics, _total = unit_of_work.topic_repository.find_all(
                subject=None, status=TopicStatus.PUBLISHED, offset=0, limit=20
            )
            usable = [topic for topic in topics if len(topic.toc_items) > 0]
            if not usable:
                print("FAIL: no published topic with TOC items.")
                print("      Run scripts/seed_demo_topic.py first.")
                return 1
            topic = usable[0]
            prompt = build_voice_viva_system_prompt(topic, default_student_params(), [])
            # And again with a weak area, to prove the priority marker appears.
            weak_id = str(sorted(topic.toc_items, key=lambda i: i.order)[1].id)
            prompt_weak = build_voice_viva_system_prompt(
                topic, default_student_params(), [weak_id]
            )
    finally:
        database_session.close()

    print(f"topic         = {topic.title} ({topic.subject})")
    print(f"toc items     = {len(topic.toc_items)}")
    print(f"prompt chars  = {len(prompt)}")
    print()

    checks = {
        "includes the topic title": topic.title in prompt,
        "includes the subject": topic.subject in prompt,
        "includes every TOC item title": all(
            item.title in prompt for item in topic.toc_items
        ),
        "includes TOC summaries": any(
            item.summary[:40] in prompt for item in topic.toc_items if item.summary
        ),
        "includes the teacher's notes": all(
            note in prompt for item in topic.toc_items for note in item.teaching_notes
        ),
        "includes student params": "academic_level=" in prompt,
        "caps turn length": "two short sentences" in prompt,
        "caps word count": "30 spoken words" in prompt,
        "one question per turn": "exactly one question mark" in prompt,
        "forbids explaining": "Do not explain a concept" in prompt,
        "forbids giving the answer": "Never give a final answer" in prompt,
        "handles 'sorry' / repeat": "IF THEY DID NOT HEAR YOU" in prompt,
        "tells it to speak first": "You start." in prompt,
        "states the viva limits": "timed viva" in prompt,
        "forbids a spoken summary": "never deliver a summary" in prompt,
        "no markdown leakage": "```" not in prompt,
    }
    weak_checks = {
        "marks a weak TOC item as priority": "[PRIORITY" in prompt_weak,
        "no priority marker when none weak": "[PRIORITY" not in prompt,
    }

    failures = [label for label, ok in {**checks, **weak_checks}.items() if not ok]
    for label, ok in {**checks, **weak_checks}.items():
        print(f"  {'OK  ' if ok else 'MISS'} {label}")

    print()
    print(f"kickoff       = {build_voice_viva_kickoff()[:70]}...")

    if args.show:
        print("\n----- SYSTEM PROMPT -----")
        print(prompt_weak)
        print("----- END -----")

    print()
    print("RESULT:", "PASS" if not failures else f"FAIL ({failures})")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
