from __future__ import annotations

from typing import Any

from pydantic import validate_call

from app.domain.entities import TopicEntity
from app.domain.enums import VivaAdvanceReason
from app.domain.interfaces import ILLMVivaClient
from app.domain.student_params import StudentParamsSnapshot
from app.infrastructure.bedrock.bedrock_mode_runtime import invoke_structured_tool
from app.infrastructure.bedrock.mode_prompt_builder import (
    build_conversation_history_text,
    build_shared_student_context,
    build_topic_context_text,
)
from app.infrastructure.bedrock.mode_turn_schemas import VIVA_TURN_SCHEMA

DEFAULT_VIVA_QUESTION_TARGET = 5


class BedrockVivaClient(ILLMVivaClient):
    @validate_call(validate_return=True)
    def generate_viva_turn(
        self,
        topic: TopicEntity,
        params: StudentParamsSnapshot,
        conversation_history: list[dict],
        mode_state: dict,
        student_message: str | None,
        advance_reason: VivaAdvanceReason | None,
    ) -> dict[str, Any]:
        questions_asked = int(mode_state["questions_asked"]) if "questions_asked" in mode_state else 0
        target = (
            int(mode_state["target_questions"])
            if "target_questions" in mode_state
            else DEFAULT_VIVA_QUESTION_TARGET
        )
        weak_ids = list(mode_state["weak_toc_item_ids"]) if "weak_toc_item_ids" in mode_state else []
        next_questions_asked = questions_asked + 1
        is_complete = next_questions_asked > target
        first_toc_id = str(topic.toc_items[0].id) if len(topic.toc_items) > 0 else ""
        if advance_reason is not None and first_toc_id != "" and first_toc_id not in weak_ids:
            weak_ids = weak_ids + [first_toc_id]

        if is_complete is True:
            mock_response = {
                "tutor_message": "Viva complete. Here is your understanding summary.",
                "question": "",
                "evaluation_of_previous": "Thanks for your responses.",
                "next_action": "complete",
                "weak_toc_item_ids": weak_ids,
                "insight_summary": (
                    f"Based on the viva for {topic.title}, revise the weaker TOC areas listed."
                ),
                "is_goal_complete": True,
                "questions_asked": questions_asked,
            }
        else:
            next_toc = (
                topic.toc_items[(next_questions_asked - 1) % len(topic.toc_items)]
                if len(topic.toc_items) > 0
                else None
            )
            question = (
                f"Explain {next_toc.title} in your own words."
                if next_toc is not None
                else f"Explain a core idea from {topic.title}."
            )
            evaluation = ""
            if student_message is not None or advance_reason is not None:
                if advance_reason is not None:
                    evaluation = f"Marked as {advance_reason.value}; moving to the next question."
                else:
                    evaluation = "Noted your answer; here is the next viva question."
            mock_response = {
                "tutor_message": question,
                "question": question,
                "evaluation_of_previous": evaluation,
                "next_action": "ask",
                "weak_toc_item_ids": weak_ids,
                "insight_summary": "",
                "is_goal_complete": False,
                "questions_asked": next_questions_asked,
            }

        advance_part = (
            f"Advance reason: {advance_reason.value}"
            if advance_reason is not None
            else "Advance reason: none"
        )
        student_part = (
            f"Student answer: {student_message}"
            if student_message is not None and student_message.strip() != ""
            else "Student answer: (none — start viva or advance)"
        )
        prompt = (
            "You are a viva examiner in KNOW YOUR UNDERSTANDING mode.\n"
            "Conduct a turn-by-turn oral viva. Do not generate slides.\n"
            "Student cannot interrupt mid-question. Pass / silence / I don't know means advance.\n"
            f"Target questions: {target}. Current questions_asked: {questions_asked}.\n"
            f"{build_topic_context_text(topic)}\n"
            f"{build_shared_student_context(params)}\n"
            f"Conversation history:\n{build_conversation_history_text(conversation_history)}\n"
            f"{student_part}\n"
            f"{advance_part}\n"
            "Rules:\n"
            "- Evaluate the previous answer briefly when present.\n"
            "- Ask one clear viva question at a time.\n"
            "- Track weak_toc_item_ids for shaky or skipped answers.\n"
            "- When complete, set next_action=complete, is_goal_complete=true, and fill insight_summary.\n"
        )
        return invoke_structured_tool(
            operation=f"viva_turn topic={topic.title}",
            prompt=prompt,
            tool_name="generate_viva_turn",
            tool_description="Generate the next viva tutor turn",
            tool_schema=VIVA_TURN_SCHEMA,
            mock_response=mock_response,
        )
