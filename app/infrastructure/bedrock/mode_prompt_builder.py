from __future__ import annotations

from pydantic import validate_call

from app.domain.entities import TopicEntity
from app.domain.student_params import StudentParamsSnapshot, format_student_params_for_prompt


@validate_call(validate_return=True)
def build_topic_context_text(topic: TopicEntity) -> str:
    toc_lines = [
        f"- id={toc_item.id} order={toc_item.order} title={toc_item.title} summary={toc_item.summary}"
        for toc_item in sorted(topic.toc_items, key=lambda item: item.order)
    ]
    toc_block = "\n".join(toc_lines) if len(toc_lines) > 0 else "- (empty TOC)"
    return (
        f"Topic title: {topic.title}\n"
        f"Subject: {topic.subject}\n"
        f"Description: {topic.description}\n"
        f"Table of contents:\n{toc_block}"
    )


@validate_call(validate_return=True)
def build_conversation_history_text(conversation_history: list[dict]) -> str:
    if len(conversation_history) == 0:
        return "(no prior turns)"
    lines = [
        f"{turn['role']}: {turn['text']}"
        for turn in conversation_history
        if isinstance(turn, dict) and "role" in turn and "text" in turn
    ]
    return "\n".join(lines) if len(lines) > 0 else "(no prior turns)"


@validate_call(validate_return=True)
def build_shared_student_context(params: StudentParamsSnapshot) -> str:
    return f"Student parameters: {format_student_params_for_prompt(params)}"
