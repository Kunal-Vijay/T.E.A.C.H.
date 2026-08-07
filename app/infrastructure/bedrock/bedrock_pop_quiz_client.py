from __future__ import annotations

from typing import Any
from uuid import uuid4

from pydantic import validate_call

from app.domain.entities import TopicEntity
from app.domain.interfaces import ILLMPopQuizClient
from app.domain.student_params import StudentParamsSnapshot
from app.infrastructure.bedrock.bedrock_mode_runtime import invoke_structured_tool
from app.infrastructure.bedrock.mode_prompt_builder import (
    build_conversation_history_text,
    build_shared_student_context,
    build_topic_context_text,
)
from app.infrastructure.bedrock.mode_turn_schemas import POP_QUIZ_TURN_SCHEMA

DEFAULT_QUIZ_QUESTION_TARGET = 5


class BedrockPopQuizClient(ILLMPopQuizClient):
    @validate_call(validate_return=True)
    def generate_pop_quiz_turn(
        self,
        topic: TopicEntity,
        params: StudentParamsSnapshot,
        conversation_history: list[dict],
        mode_state: dict,
        student_message: str | None,
    ) -> dict[str, Any]:
        questions_asked = int(mode_state["questions_asked"]) if "questions_asked" in mode_state else 0
        awaiting_answer = bool(mode_state["awaiting_answer"]) if "awaiting_answer" in mode_state else False
        target = (
            int(mode_state["target_questions"])
            if "target_questions" in mode_state
            else DEFAULT_QUIZ_QUESTION_TARGET
        )

        if awaiting_answer is True and student_message is not None:
            phase = "explain_attempt"
            next_questions_asked = questions_asked
            is_complete = questions_asked >= target
            mock_response = {
                "tutor_message": "Here is the explanation for that attempt.",
                "phase": "complete" if is_complete is True else "explain_attempt",
                "question_text": "",
                "options": [],
                "selected_option_is_correct": None,
                "explanation_text": (
                    f"You answered: {student_message}. "
                    f"Recall the key idea from {topic.title} and compare with the correct approach."
                ),
                "slides": [
                    {
                        "slide_id": str(uuid4()),
                        "layout": "title_content",
                        "elements": [
                            {
                                "element_id": str(uuid4()),
                                "type": "heading",
                                "content": "Quick revision",
                            },
                            {
                                "element_id": str(uuid4()),
                                "type": "text",
                                "content": f"Review: {topic.title}",
                            },
                        ],
                    }
                ],
                "is_goal_complete": is_complete,
                "questions_asked": next_questions_asked,
            }
        else:
            next_questions_asked = questions_asked + 1
            is_complete = False
            option_a = str(uuid4())
            option_b = str(uuid4())
            mock_response = {
                "tutor_message": f"Pop quiz question {next_questions_asked} of {target}.",
                "phase": "ask_question",
                "question_text": f"What is a key idea in {topic.title}?",
                "options": [
                    {"option_id": option_a, "text": "Core concept from the TOC", "is_correct": True},
                    {"option_id": option_b, "text": "Unrelated idea", "is_correct": False},
                ],
                "selected_option_is_correct": None,
                "explanation_text": f"Think carefully about {topic.title} before you answer.",
                "slides": [
                    {
                        "slide_id": str(uuid4()),
                        "layout": "title_content",
                        "elements": [
                            {
                                "element_id": str(uuid4()),
                                "type": "heading",
                                "content": f"Question {next_questions_asked}",
                            },
                            {
                                "element_id": str(uuid4()),
                                "type": "text",
                                "content": f"What is a key idea in {topic.title}?",
                            },
                        ],
                    }
                ],
                "is_goal_complete": False,
                "questions_asked": next_questions_asked,
            }

        student_part = (
            f"Student message: {student_message}"
            if student_message is not None and student_message.strip() != ""
            else "Student message: (start or continue quiz — ask next question if not awaiting answer)"
        )
        prompt = (
            "You are an interactive voice tutor in POP QUIZ mode.\n"
            "Goal: ask revision questions on the topic and explain after each attempt.\n"
            f"Target questions: {target}. Current questions_asked: {questions_asked}. "
            f"awaiting_answer={awaiting_answer}.\n"
            f"{build_topic_context_text(topic)}\n"
            f"{build_shared_student_context(params)}\n"
            f"Conversation history:\n{build_conversation_history_text(conversation_history)}\n"
            f"{student_part}\n"
            "Rules:\n"
            "- If awaiting_answer is false, phase must be ask_question with question_text and options.\n"
            "- If awaiting_answer is true, phase must be explain_attempt with explanation slides/speech.\n"
            "- After enough questions are asked and explained, set is_goal_complete true and phase complete.\n"
            "- Adapt difficulty using prior_knowledge and exam_target.\n"
        )
        return invoke_structured_tool(
            operation=f"pop_quiz_turn topic={topic.title}",
            prompt=prompt,
            tool_name="generate_pop_quiz_turn",
            tool_description="Generate the next pop-quiz tutor turn",
            tool_schema=POP_QUIZ_TURN_SCHEMA,
            mock_response=mock_response,
        )
