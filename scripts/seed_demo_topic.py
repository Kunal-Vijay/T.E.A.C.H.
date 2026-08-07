"""Seed a published topic with TOC items, so the student flow has something to run.

Idempotent: re-running updates the same topic rather than creating duplicates.

Usage:
    PYTHONPATH=. ./venv312/bin/python scripts/seed_demo_topic.py
"""

from __future__ import annotations

import sys
import uuid

from dotenv import load_dotenv

load_dotenv()

from app.core.database import SessionFactory  # noqa: E402
from app.domain.entities import TopicEntity, TopicTocItemEntity  # noqa: E402
from app.domain.enums import TopicStatus  # noqa: E402
from app.infrastructure.unit_of_work import UnitOfWork  # noqa: E402

TOPIC_TITLE = "Laws of Motion"
TOPIC_SUBJECT = "Physics"
TOPIC_DESCRIPTION = (
    "Newton's three laws of motion and the concept of force: what force is, how it changes "
    "motion, and why forces always come in pairs. Aimed at Class 11 / JEE Main preparation."
)

TOC = [
    (
        "What force is",
        "Force is an external push or pull arising from an interaction between two objects. It can "
        "change an object's state of rest, its state of motion, or its shape.",
        [
            "Stress that force is an interaction between two objects, never a property one object owns",
            "A force can act without producing movement, e.g. pushing a wall",
        ],
    ),
    (
        "Newton's first law and inertia",
        "An object stays at rest or in uniform motion unless acted on by a net external force. "
        "Inertia is the resistance to any change in that state.",
        [
            "Catch the Aristotelian idea that constant speed needs a constant force",
            "Use the puck-on-ice example to separate 'no motion' from 'no net force'",
        ],
    ),
    (
        "Newton's second law",
        "The net force on an object equals its mass times its acceleration, F = ma. Force is "
        "proportional to acceleration, not to velocity.",
        [
            "Students very often say F = mv; probe for acceleration versus velocity",
            "Emphasise that F = ma refers to the NET force",
        ],
    ),
    (
        "Newton's third law",
        "For every action there is an equal and opposite reaction. The two forces act on different "
        "objects, which is why they do not cancel out.",
        [
            "The action-reaction pair acts on two different bodies, so it never cancels",
        ],
    ),
]


def main() -> int:
    database_session = SessionFactory()
    unit_of_work = UnitOfWork(database_session)
    try:
        with unit_of_work:
            existing, _total = unit_of_work.topic_repository.find_all(
                subject=None, status=None, offset=0, limit=100
            )
            match = next((topic for topic in existing if topic.title == TOPIC_TITLE), None)

            if match is None:
                topic_id = uuid.uuid4()
                created = unit_of_work.topic_repository.create(
                    TopicEntity(
                        id=topic_id,
                        title=TOPIC_TITLE,
                        subject=TOPIC_SUBJECT,
                        description=TOPIC_DESCRIPTION,
                        status=TopicStatus.PUBLISHED,
                        created_by="seed",
                    )
                )
                topic_id = created.id
                action = "created"
            else:
                topic_id = match.id
                action = "updated"

            unit_of_work.topic_repository.replace_toc_items(
                topic_id,
                [
                    TopicTocItemEntity(
                        id=uuid.uuid4(),
                        topic_id=topic_id,
                        order=index,
                        title=title,
                        summary=summary,
                        teaching_notes=notes,
                    )
                    for index, (title, summary, notes) in enumerate(TOC, start=1)
                ],
            )
            unit_of_work.topic_repository.update_status(topic_id, TopicStatus.PUBLISHED)

        with unit_of_work:
            final = unit_of_work.topic_repository.find_by_id(topic_id)

        if final is None:
            print("FAIL: topic vanished after seeding")
            return 1

        print(f"{action} topic {final.id}")
        print(f"  title    = {final.title}")
        print(f"  subject  = {final.subject}")
        print(f"  status   = {final.status.value}")
        print(f"  toc      = {len(final.toc_items)} items")
        for item in sorted(final.toc_items, key=lambda entry: entry.order):
            print(f"    {item.order}. {item.title}  ({len(item.teaching_notes)} teaching notes)")
        return 0
    finally:
        database_session.close()


if __name__ == "__main__":
    sys.exit(main())
