from __future__ import annotations

import re

from pydantic import validate_call

from app.domain.entities import TopicEntity

OFF_TOPIC_PATTERNS = (
    r"\bwhat(?:'s| is) your name\b",
    r"\bwho are you\b",
    r"\bwhat(?:'s| is) your age\b",
    r"\bare you (?:a )?(?:bot|ai|human|real)\b",
    r"\btell me (?:a )?joke\b",
    r"\bsing (?:a |me )?(?:a )?song\b",
    r"\bhow old are you\b",
    r"\bwhere do you live\b",
    r"\bdo you have (?:a )?(?:girlfriend|boyfriend|family)\b",
    r"\bwhat(?:'s| is) the weather\b",
)


@validate_call(validate_return=True)
def is_off_topic_student_message(student_message: str) -> bool:
    normalized = " ".join(student_message.lower().split())
    if normalized == "":
        return False
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, normalized) is not None:
            return True
    return False


@validate_call(validate_return=True)
def build_off_topic_redirect_response(topic: TopicEntity) -> dict:
    toc_titles = [toc_item.title for toc_item in sorted(topic.toc_items, key=lambda item: item.order)]
    toc_hint = ", ".join(toc_titles[:3]) if len(toc_titles) > 0 else topic.title
    redirect_text = (
        f"Let's stay focused on {topic.title}. "
        f"Ask me a doubt about {toc_hint}, or a related problem you want to solve."
    )
    return {
        "tutor_message": redirect_text,
        "slides": [
            {
                "slide_id": "off-topic-redirect",
                "layout": "title_content",
                "elements": [
                    {
                        "element_id": "off-topic-heading",
                        "type": "heading",
                        "content": f"Back to {topic.title}",
                    },
                    {
                        "element_id": "off-topic-text",
                        "type": "text",
                        "content": "Ask a doubt or problem from the topic table of contents.",
                    },
                    {
                        "element_id": "off-topic-bullets",
                        "type": "bullet_list",
                        "content": toc_titles[:5] if len(toc_titles) > 0 else [topic.title],
                    },
                ],
                "explanation_text": redirect_text,
            }
        ],
        "is_goal_complete": False,
    }
