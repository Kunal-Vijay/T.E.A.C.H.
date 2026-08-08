from __future__ import annotations

from typing import Any
from uuid import uuid4

from pydantic import validate_call

from app.config import settings
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
        mock_explanation = (
            f"Regarding your question: {student_message}. "
            f"Using the concepts in {topic.title}, focus on the related TOC ideas and solve step by step."
        )
        mock_response = {
            "tutor_message": f"Here is a clear explanation for your doubt on {topic.title}.",
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
                    "explanation_text": mock_explanation,
                }
            ],
            "is_goal_complete": False,
        }
        prompt = (
            "You are an interactive voice tutor in DOUBT mode.\n"
            "Goal: answer student doubts and help solve problems based on this topic only.\n"
            "Return rich teaching slides with spoken narration on every slide.\n"
            f"{build_topic_context_text(topic)}\n"
            f"{build_doubt_student_context(params)}\n"
            f"Conversation history:\n{build_conversation_history_text(conversation_history)}\n"
            f"Student message: {student_message}\n"
            "Slide content rules (IMPORTANT — do not return sparse slides):\n"
            "- Return 1 slide for quick clarifications, or 2 slides when the doubt needs steps/examples.\n"
            "- Each slide MUST have at least 3 elements: heading, text (2-3 sentences), bullet_list (3-5 points).\n"
            "- Slide elements are the structured whiteboard summary; explanation_text is the full spoken lesson.\n"
            "- Each slide explanation_text MUST be 60-150 words — clear, conversational, step-by-step teaching.\n"
            "- Use preferred_explanation style (e.g. step_by_step = numbered reasoning in speech and bullets).\n"
            "- For word-origin or definition doubts, include etymology/breakdown in bullets AND in explanation_text.\n"
            "General rules:\n"
            "- Stay strictly within the topic TOC and related academic doubts/problems.\n"
            "- OFF-TOPIC / PERSONAL / CHAT questions (name, identity, jokes, weather, small talk, etc.):\n"
            "  do NOT answer them, do NOT invent a persona name, do NOT use emojis.\n"
            "  Immediately redirect with one short line asking for a topic doubt.\n"
            "  Set tutor_message and every slide explanation_text to the SAME redirect text.\n"
            "  Slide should only show the topic/TOC reminder, not the off-topic answer.\n"
            "- Every slide MUST include its own explanation_text for that slide only.\n"
            "- For on-topic doubts: tutor_message should summarize; slide explanation_text is the spoken narration.\n"
            "- No emojis in tutor_message or explanation_text.\n"
            "- Use knowledge_level and preferred_explanation for on-topic answers.\n"
            "- Also respect language_style from the student profile.\n"
            "- is_goal_complete is true only if the student clearly says they are done / no more doubts.\n"
        )
        response = invoke_structured_tool(
            operation=f"doubt_turn topic={topic.title}",
            prompt=prompt,
            tool_name="generate_doubt_turn",
            tool_description=(
                "Generate the next doubt-mode tutor turn with rich slide elements "
                "(heading, text, bullet_list) and detailed spoken explanation_text"
            ),
            tool_schema=DOUBT_TURN_SCHEMA,
            mock_response=mock_response,
            model_id=settings.resolve_doubt_model_id(),
            max_tokens=settings.BEDROCK_DOUBT_MAX_TOKENS,
        )
        return self._normalize_spoken_and_display_text(response)

    def _enrich_sparse_slides(self, response: dict[str, Any]) -> dict[str, Any]:
        slides = response.get("slides")
        if not isinstance(slides, list):
            return response
        for slide in slides:
            if not isinstance(slide, dict):
                continue
            elements = slide.get("elements")
            if not isinstance(elements, list):
                elements = []
                slide["elements"] = elements
            explanation = str(slide.get("explanation_text", "")).strip()
            has_heading = any(
                isinstance(el, dict) and el.get("type") == "heading" for el in elements
            )
            has_text = any(
                isinstance(el, dict) and el.get("type") == "text" for el in elements
            )
            has_bullets = any(
                isinstance(el, dict) and el.get("type") == "bullet_list" for el in elements
            )
            if not has_heading:
                elements.insert(
                    0,
                    {
                        "element_id": str(uuid4()),
                        "type": "heading",
                        "content": "Answer",
                    },
                )
            if not has_text and explanation != "":
                first_sentence = explanation.split(". ")[0].strip()
                if first_sentence != "" and not first_sentence.endswith("."):
                    first_sentence = f"{first_sentence}."
                elements.append(
                    {
                        "element_id": str(uuid4()),
                        "type": "text",
                        "content": first_sentence or explanation[:240],
                    },
                )
            if not has_bullets and explanation != "":
                sentences = [
                    part.strip()
                    for part in explanation.replace("?", ".").split(".")
                    if part.strip() != ""
                ]
                bullet_points = sentences[1:6] if len(sentences) > 1 else sentences[:4]
                if len(bullet_points) > 0:
                    elements.append(
                        {
                            "element_id": str(uuid4()),
                            "type": "bullet_list",
                            "content": bullet_points,
                        },
                    )
        return response

    def _normalize_spoken_and_display_text(self, response: dict[str, Any]) -> dict[str, Any]:
        response = self._enrich_sparse_slides(response)
        tutor_message = str(response["tutor_message"]) if "tutor_message" in response else ""
        slides = response["slides"] if "slides" in response and isinstance(response["slides"], list) else []
        first_explanation = ""
        for slide in slides:
            if not isinstance(slide, dict):
                continue
            if "explanation_text" not in slide or str(slide["explanation_text"]).strip() == "":
                slide["explanation_text"] = tutor_message
            if first_explanation == "" and str(slide["explanation_text"]).strip() != "":
                first_explanation = str(slide["explanation_text"])
        if tutor_message.strip() == "" and first_explanation.strip() != "":
            response["tutor_message"] = first_explanation
        return response
