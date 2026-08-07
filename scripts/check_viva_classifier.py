"""Unit checks for the viva question/answer classifier.

The bug this guards against: saying "sorry" was counted as answering a question.
"""

from __future__ import annotations

import sys

from app.domain.viva_turn_classifier import (
    count_viva_progress,
    is_substantive_answer,
    is_tutor_question,
)

TUTOR_QUESTION_CASES = [
    # Real viva questions.
    ("Can you explain what force means in your own words?", True),
    ("What makes you say velocity rather than acceleration?", True),
    ("You push a wall and it doesn't move. Was there a force?", True),
    ("Why?", True),
    # Question mark dropped by the transcriber.
    ("What keeps a puck sliding on smooth ice", True),
    ("Explain how that connects to Newton's first law", True),
    # NOT new questions — the tutor asking the student to repeat themselves.
    ("Sorry, could you repeat that?", False),
    ("I'm sorry, could you say that again?", False),
    ("Can you say that again?", False),
    ("Are you still there?", False),
    ("Did you hear that?", False),
    ("Can you hear me?", False),
    # Statements.
    ("That's not quite right.", False),
    ("", False),
    ("Let's move on.", False),
]

STUDENT_ANSWER_CASES = [
    # The reported bug: these must NOT count.
    ("sorry", False),
    ("Sorry.", False),
    ("I'm sorry", False),
    ("sorry about that", False),
    ("my bad", False),
    ("what?", False),
    ("huh", False),
    ("pardon", False),
    ("what was that", False),
    ("can you repeat that", False),
    ("sorry, can you repeat that?", False),
    ("say that again", False),
    ("repeat the question", False),
    ("come again", False),
    ("I didn't catch that", False),
    ("one sec", False),
    ("hold on", False),
    ("wait", False),
    ("um", False),
    ("uhh", False),
    ("hmm", False),
    ("okay", False),
    ("yeah", False),
    ("hello", False),
    ("thanks", False),
    ("testing 1 2", False),
    ("", False),
    ("   ", False),
    # Short but genuine answers — these MUST count.
    ("acceleration", True),
    ("no", True),
    ("yes because it accelerates", True),
    ("F equals m a", True),
    ("I don't know", True),
    ("I'm not sure, maybe friction?", True),
    ("Force is a push or a pull between two objects.", True),
    # Filler prefix followed by real content still counts.
    ("sorry, I think it's acceleration", True),
    ("um, force is a push", True),
    ("okay, so it would keep moving", True),
]


def check_progress() -> list[str]:
    failures: list[str] = []

    # The reported scenario: the student says "sorry" repeatedly.
    saying_sorry = [
        ("ASSISTANT", "Welcome. Can you explain what force means in your own words?"),
        ("USER", "sorry"),
        ("USER", "sorry"),
        ("USER", "what?"),
        ("USER", "can you repeat that"),
    ]
    asked, answered = count_viva_progress(saying_sorry)
    if (asked, answered) != (1, 0):
        failures.append(f'saying "sorry" repeatedly -> asked={asked} answered={answered}, want (1, 0)')

    # A clean run of three question/answer pairs.
    clean = [
        ("ASSISTANT", "Can you explain force?"),
        ("USER", "It's a push or pull between two objects."),
        ("ASSISTANT", "What happens if you push a wall?"),
        ("USER", "It doesn't move but there is still a force."),
        ("ASSISTANT", "Why does it not move?"),
        ("USER", "Because the wall pushes back equally."),
    ]
    asked, answered = count_viva_progress(clean)
    if (asked, answered) != (3, 3):
        failures.append(f"clean run -> asked={asked} answered={answered}, want (3, 3)")

    # Filler between a question and its real answer must not consume the question.
    with_filler = [
        ("ASSISTANT", "Can you explain force?"),
        ("USER", "sorry"),
        ("USER", "can you repeat that"),
        ("ASSISTANT", "Sure, could you say what force means?"),
        ("USER", "A push or a pull."),
    ]
    asked, answered = count_viva_progress(with_filler)
    if (asked, answered) != (1, 1):
        failures.append(f"filler then answer -> asked={asked} answered={answered}, want (1, 1)")

    # The tutor rephrasing while the student is silent must not inflate the count.
    rephrased = [
        ("ASSISTANT", "What is force?"),
        ("ASSISTANT", "In other words, how would you define it?"),
        ("ASSISTANT", "Any thoughts on what force means?"),
        ("USER", "A push."),
    ]
    asked, answered = count_viva_progress(rephrased)
    if (asked, answered) != (1, 1):
        failures.append(f"tutor rephrasing -> asked={asked} answered={answered}, want (1, 1)")

    # Student volunteering extra detail should not count as answering a new question.
    volunteered = [
        ("ASSISTANT", "What is force?"),
        ("USER", "A push or pull."),
        ("USER", "And it needs two objects."),
    ]
    asked, answered = count_viva_progress(volunteered)
    if (asked, answered) != (1, 1):
        failures.append(f"volunteered extra -> asked={asked} answered={answered}, want (1, 1)")

    # Nothing at all.
    if count_viva_progress([]) != (0, 0):
        failures.append("empty transcript did not return (0, 0)")

    return failures


def main() -> int:
    failures: list[str] = []

    tutor_pass = 0
    for text, expected in TUTOR_QUESTION_CASES:
        if is_tutor_question(text) == expected:
            tutor_pass += 1
        else:
            failures.append(f"is_tutor_question({text!r}) -> {not expected}, want {expected}")
    print(f"is_tutor_question    : {tutor_pass}/{len(TUTOR_QUESTION_CASES)} pass")

    answer_pass = 0
    for text, expected in STUDENT_ANSWER_CASES:
        if is_substantive_answer(text) == expected:
            answer_pass += 1
        else:
            failures.append(f"is_substantive_answer({text!r}) -> {not expected}, want {expected}")
    print(f"is_substantive_answer: {answer_pass}/{len(STUDENT_ANSWER_CASES)} pass")

    progress_failures = check_progress()
    scenarios = 6
    print(f"count_viva_progress  : {scenarios - len(progress_failures)}/{scenarios} scenarios pass")
    failures.extend(progress_failures)

    print()
    for failure in failures:
        print(f"FAIL  {failure}")
    print("RESULT:", "PASS" if not failures else "FAIL")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
