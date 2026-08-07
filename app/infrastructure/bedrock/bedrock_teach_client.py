from __future__ import annotations

from typing import Any
from uuid import uuid4

from pydantic import validate_call

from app.domain.entities import TopicEntity
from app.domain.interfaces import ILLMTeachClient
from app.domain.student_params import StudentParamsSnapshot
from app.infrastructure.bedrock.bedrock_mode_runtime import invoke_structured_tool
from app.infrastructure.bedrock.mode_prompt_builder import (
    build_conversation_history_text,
    build_teach_student_context,
    build_topic_context_text,
)
from app.infrastructure.bedrock.mode_turn_schemas import TEACH_TURN_SCHEMA


class BedrockTeachClient(ILLMTeachClient):
    @validate_call(validate_return=True)
    def generate_teach_turn(
        self,
        topic: TopicEntity,
        params: StudentParamsSnapshot,
        conversation_history: list[dict],
        taught_toc_item_ids: list[str],
        student_message: str | None,
    ) -> dict[str, Any]:
        remaining_toc = [
            toc_item
            for toc_item in topic.toc_items
            if str(toc_item.id) not in taught_toc_item_ids
        ]
        next_toc = remaining_toc[0] if len(remaining_toc) > 0 else None
        mock_slide_id = str(uuid4())
        mock_explanation = (
            f"Today we focus on {next_toc.title}. {next_toc.summary}"
            if next_toc is not None
            else f"You have completed the teaching goal for {topic.title}."
        )
        mock_response = {
            "tutor_message": (
                f"Let's learn {next_toc.title}."
                if next_toc is not None
                else f"We have covered {topic.title}. Great work!"
            ),
            "slides": [
                {
                    "slide_id": mock_slide_id,
                    "layout": "title_content",
                    "elements": [
                        {
                            "element_id": str(uuid4()),
                            "type": "heading",
                            "content": next_toc.title if next_toc is not None else topic.title,
                        },
                        {
                            "element_id": str(uuid4()),
                            "type": "text",
                            "content": (
                                next_toc.summary
                                if next_toc is not None
                                else "Teaching complete. Ask any final doubts about what we covered."
                            ),
                        },
                    ],
                    "explanation_text": mock_explanation,
                }
            ],
            "taught_toc_item_ids": (
                taught_toc_item_ids + [str(next_toc.id)]
                if next_toc is not None
                else taught_toc_item_ids
            ),
            "is_goal_complete": next_toc is None,
        }

        student_part = (
            f"Student message: {student_message}"
            if student_message is not None and student_message.strip() != ""
            else "Student message: (session start — begin teaching the first uncovered TOC item)"
        )
        prompt = (
            "You are an interactive voice tutor in TEACH mode.\n"
            "Goal: teach the topic using the TOC. Students may ask doubts only about material already taught.\n"
            "Return the next teaching turn with one or more slides.\n"
            f"{build_topic_context_text(topic)}\n"
            f"{build_teach_student_context(params)}\n"
            f"Already taught TOC ids: {taught_toc_item_ids}\n"
            f"Conversation history:\n{build_conversation_history_text(conversation_history)}\n"
            f"{student_part}\n"
            "Rules:\n"
            "- Adapt explanation_depth, pace, and interaction_mode from session parameters.\n"
            "- Also respect language_style and learning_style from the student profile.\n"
            "- Every slide MUST include its own explanation_text: the exact spoken narration for THAT slide only.\n"
            "- Do not put the full lesson narration only on the first slide; each slide gets the speech that matches its on-screen content.\n"
            "- Keep slide element content concise; put the full spoken teaching in each slide explanation_text.\n"
            "- No emojis in slide content or explanation_text.\n"
            "- taught_toc_item_ids must include previously taught ids plus any newly covered in this turn.\n"
            "- is_goal_complete is true only when every TOC item has been taught.\n"
            "- If the student asks a doubt about untaught material, briefly defer and continue teaching.\n"
        )
        return invoke_structured_tool(
            operation=f"teach_turn topic={topic.title}",
            prompt=prompt,
            tool_name="generate_teach_turn",
            tool_description="Generate the next teach-mode tutor turn",
            tool_schema=TEACH_TURN_SCHEMA,
            mock_response=mock_response,
        )
