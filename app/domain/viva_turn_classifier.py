"""Decides what counts as a viva question and what counts as answering it.

The naive approach — treat every student utterance as an answer — miscounts badly.
Saying "sorry" or "can you repeat that" is not answering a question, and neither is
a hesitation noise that the speech recogniser picked up.

The rule here is deliberately asymmetric: a student turn counts as an answer unless
it is *clearly* a non-answer. A length floor would be wrong, because plenty of real
answers are one word ("acceleration", "no"). So the filter targets specific
non-answer shapes instead: apologies, clarification requests and pure hesitation.

"I don't know" deliberately DOES count. It is a genuine response to the question and
it is evidence the assessment should see, not a turn to be retried.
"""

from __future__ import annotations

import re

# Interrogative openers, for transcripts where the question mark was dropped.
_QUESTION_OPENERS = (
    "what",
    "why",
    "how",
    "when",
    "where",
    "which",
    "who",
    "whose",
    "can you",
    "could you",
    "would you",
    "do you",
    "does",
    "did you",
    "is it",
    "is there",
    "are there",
    "are you",
    "was there",
    "will it",
    "tell me",
    "walk me through",
    "explain",
    "describe",
    "give me",
    "suppose",
    "imagine",
)

# Things the TUTOR might say that end in "?" but are not new viva questions.
_TUTOR_NON_QUESTION_PATTERNS = (
    r"^\s*(?:i'?m\s+)?sorry\b.*\?\s*$",
    r"\b(?:could|can|would)\s+you\s+(?:please\s+)?(?:say|repeat)\b",
    r"\bsay\s+(?:that\s+)?again\b",
    r"\brepeat\s+(?:that|it|the\s+question)\b",
    r"\bare\s+you\s+(?:still\s+)?(?:there|with\s+me)\b",
    r"\bdid\s+you\s+(?:hear|catch)\s+(?:that|me)\b",
    r"\bcan\s+you\s+hear\s+me\b",
)

# Student turns that do not answer anything.
_STUDENT_NON_ANSWER_PATTERNS = (
    # Apologies with no content.
    r"^(?:oh\s+)?(?:i'?m\s+)?sorry(?:\s+about\s+(?:that|this))?$",
    r"^my\s+(?:bad|apologies)$",
    r"^(?:oops|whoops)$",
    # Clarification requests.
    r"^(?:sorry,?\s*)?(?:what|huh|eh|pardon|excuse\s+me)$",
    r"^(?:sorry,?\s*)?what\s+(?:was\s+that|did\s+you\s+say|do\s+you\s+mean)$",
    r"^(?:sorry,?\s*)?(?:can|could|would)\s+you\s+(?:please\s+)?(?:say|repeat)\b.*$",
    r"^(?:sorry,?\s*)?(?:please\s+)?say\s+(?:that\s+)?again$",
    r"^(?:sorry,?\s*)?(?:please\s+)?repeat\s+(?:that|it|the\s+question)?$",
    r"^(?:sorry,?\s*)?come\s+again$",
    r"^(?:sorry,?\s*)?i\s+(?:did\s*n'?t|didnt)\s+(?:hear|catch|get)\s+(?:that|you|it)$",
    r"^(?:sorry,?\s*)?one\s+(?:sec|second|moment)$",
    r"^(?:sorry,?\s*)?(?:hold|hang)\s+on$",
    r"^(?:sorry,?\s*)?wait$",
    # Pure hesitation / recogniser noise.
    r"^(?:u+m+|u+h+|e+r+m*|h+m+|a+h+|o+h+|mhm+|hmm+)$",
    r"^(?:yeah|yep|ok|okay|right|sure|mm)$",
    r"^(?:hello|hi|hey|hey\s+there)$",
    r"^(?:thanks|thank\s+you|cheers)$",
    r"^(?:test|testing)(?:\s+\d+)*$",
)

_COMPILED_TUTOR_NON_QUESTIONS = [
    re.compile(pattern, re.IGNORECASE) for pattern in _TUTOR_NON_QUESTION_PATTERNS
]
_COMPILED_STUDENT_NON_ANSWERS = [
    re.compile(pattern, re.IGNORECASE) for pattern in _STUDENT_NON_ANSWER_PATTERNS
]


def _normalize(text: str) -> str:
    """Lowercase, drop surrounding punctuation, collapse whitespace."""
    lowered = text.strip().lower()
    lowered = re.sub(r"\s+", " ", lowered)
    # Strip trailing/leading punctuation but keep internal apostrophes.
    return lowered.strip(" .,!?;:-–—\"'()[]")


def is_tutor_question(text: str) -> bool:
    """True when a tutor turn poses a new question to the student.

    Excludes the tutor's own clarification requests ("sorry, could you repeat
    that?") — those end in a question mark but do not advance the viva.
    """
    stripped = text.strip()
    if stripped == "":
        return False

    for pattern in _COMPILED_TUTOR_NON_QUESTIONS:
        if pattern.search(stripped):
            return False

    if "?" in stripped:
        return True

    # Speech transcripts sometimes lose the question mark, so fall back to
    # recognising an interrogative opener.
    normalized = _normalize(stripped)
    return any(normalized.startswith(opener) for opener in _QUESTION_OPENERS)


def is_substantive_answer(text: str) -> bool:
    """True when a student turn actually responds to the question.

    Defaults to True. Only recognised non-answers (apologies, clarification
    requests, hesitation noise) are rejected, so short-but-real answers such as
    "acceleration" or "no" still count.
    """
    normalized = _normalize(text)
    if normalized == "":
        return False

    for pattern in _COMPILED_STUDENT_NON_ANSWERS:
        if pattern.fullmatch(normalized) is not None:
            return False

    # An apology or clarification request followed by real content still counts,
    # so only reject when nothing survives stripping the filler prefix.
    without_filler = re.sub(
        r"^(?:(?:oh|well|so|um|uh|erm|hmm)\s+|(?:i'?m\s+)?sorry[,\s]+|okay[,\s]+|yeah[,\s]+)+",
        "",
        normalized,
    ).strip()
    return without_filler != ""


def count_viva_progress(turns: list[tuple[str, str]]) -> tuple[int, int]:
    """Count (questions_asked, questions_answered) over an ordered transcript.

    `turns` is a list of (role, text) where role is USER or ASSISTANT.

    A question is counted when the tutor asks it. It is counted as answered when a
    substantive student turn follows it. Repeated tutor questions without an answer
    in between do not inflate the count, so a student who stays silent while the
    tutor rephrases is not credited with extra progress.
    """
    questions_asked = 0
    questions_answered = 0
    awaiting_answer = False

    for role, text in turns:
        if role.upper() == "ASSISTANT":
            if is_tutor_question(text) and not awaiting_answer:
                questions_asked += 1
                awaiting_answer = True
        elif role.upper() == "USER":
            if awaiting_answer and is_substantive_answer(text):
                questions_answered += 1
                awaiting_answer = False

    return questions_asked, questions_answered
