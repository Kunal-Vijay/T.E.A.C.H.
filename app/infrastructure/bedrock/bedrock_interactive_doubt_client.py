from __future__ import annotations

from typing import Any
from uuid import uuid4

from pydantic import validate_call

from app.domain.entities import TopicEntity
from app.domain.interfaces import ILLMInteractiveDoubtClient
from app.domain.student_params import StudentParamsSnapshot
from app.infrastructure.bedrock.bedrock_mode_runtime import invoke_structured_tool
from app.infrastructure.bedrock.doubt_topic_guard import (
    build_off_topic_redirect_response,
    is_off_topic_student_message,
)
from app.infrastructure.bedrock.mode_prompt_builder import (
    build_conversation_history_text,
    build_doubt_student_context,
    build_topic_context_text,
)
from app.infrastructure.bedrock.mode_turn_schemas import DOUBT_TURN_SCHEMA


class BedrockInteractiveDoubtClient(ILLMInteractiveDoubtClient):
    @validate_call(validate_return=True)
    def generate_doubt_turn(
        self,
        topic: TopicEntity,
        params: StudentParamsSnapshot,
        conversation_history: list[dict],
        student_message: str,
    ) -> dict[str, Any]:
        if is_off_topic_student_message(student_message):
            return build_off_topic_redirect_response(topic)

        mock_slide_id = str(uuid4())
        mock_response = {
            "tutor_message": f"Here is a clear explanation for your doubt on {topic.title}.",
            "explanation_text": (
                f"Regarding your question: {student_message}. "
                f"Using the concepts in {topic.title}, focus on the related TOC ideas and solve step by step."
            ),
            "slides": [
                {
                    "slide_id": mock_slide_id,
                    "layout": "title_content",
                    "elements": [
                        {
                            "element_id": str(uuid4()),
                            "type": "heading",
                            "content": "Doubt resolved",
                        },
                        {
                            "element_id": str(uuid4()),
                            "type": "text",
                            "content": student_message,
                        },
                        {
                            "element_id": str(uuid4()),
                            "type": "bullet_list",
                            "content": [
                                "Identify the relevant concept",
                                "Apply it to the question",
                                "Check the final answer",
                            ],
                        },
                    ],
                }
            ],
            "is_goal_complete": False,
        }
        prompt = (
            "You are an interactive voice tutor in DOUBT mode.\n"
            "Goal: answer student doubts and help solve problems based on this topic only.\n"
            "Return slides when a visual explanation helps; always provide spoken explanation_text.\n"
            f"{build_topic_context_text(topic)}\n"
            f"{build_doubt_student_context(params)}\n"
            f"Conversation history:\n{build_conversation_history_text(conversation_history)}\n"
            f"Student message: {student_message}\n"
            "Rules:\n"
            "- Stay strictly within the topic TOC and related academic doubts/problems.\n"
            "- OFF-TOPIC / PERSONAL / CHAT questions (name, identity, jokes, weather, small talk, etc.):\n"
            "  do NOT answer them, do NOT invent a persona name, do NOT use emojis.\n"
            "  Immediately redirect with one short line asking for a topic doubt.\n"
            "  Set tutor_message and explanation_text to the SAME redirect text.\n"
            "  Slide should only show the topic/TOC reminder, not the off-topic answer.\n"
            "- For on-topic doubts: tutor_message and explanation_text must match in meaning;\n"
            "  explanation_text is the exact spoken narration.\n"
            "- No emojis in tutor_message or explanation_text.\n"
            "- Use knowledge_level and preferred_explanation for on-topic answers.\n"
            "- Also respect language_style from the student profile.\n"
            "- is_goal_complete is true only if the student clearly says they are done / no more doubts.\n"
        )
        response = invoke_structured_tool(
            operation=f"doubt_turn topic={topic.title}",
            prompt=prompt,
            tool_name="generate_doubt_turn",
            tool_description="Generate the next doubt-mode tutor turn",
            tool_schema=DOUBT_TURN_SCHEMA,
            mock_response=mock_response,
        )
        return self._normalize_spoken_and_display_text(response)

    def _normalize_spoken_and_display_text(self, response: dict[str, Any]) -> dict[str, Any]:
        tutor_message = str(response["tutor_message"]) if "tutor_message" in response else ""
        explanation_text = (
            str(response["explanation_text"]) if "explanation_text" in response else ""
        )
        if tutor_message.strip() == "" and explanation_text.strip() != "":
            response["tutor_message"] = explanation_text
        elif explanation_text.strip() == "" and tutor_message.strip() != "":
            response["explanation_text"] = tutor_message
        elif tutor_message.strip() != explanation_text.strip():
            response["tutor_message"] = explanation_text if explanation_text.strip() != "" else tutor_message
            response["explanation_text"] = response["tutor_message"]
        return response
