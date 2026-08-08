# T.E.A.C.H. — Hackathon Speaker Notes

**Total time:** ~5–6 minutes (slides ~3 min · live demo ~2–3 min)  
**Audience:** Infinity Learn leadership, product, engineering, judges  
**Core narrative:** Our teachers are exceptional — but they can't be everywhere, every time. Nova fills the gaps as a bridge, not a replacement.

---

## Slide 1 — Title · T.E.A.C.H.

**~30 seconds**

"T.E.A.C.H. — Teacherless Education through Autonomous Cognitive Heuristics.

We built a **concept gap filler** — an agent that sits between the student and the teacher.

Our teachers are exceptional. But they can't be available every time, everywhere. When class ends, doubts don't. When a student lags on one concept, the whole batch can't pause. When a student hesitates to ask again — 'what will the teacher think?' — the gap only grows.

Our platform fills that gap. Not by replacing teachers. By extending their reach."

---

## Slide 2 — The Problem

**~50 seconds**

"Let me start with something important: **our teachers are exceptional.**

But they can't be available every time, everywhere. They teach a batch. They have limited class time. And even the best teacher cannot give uniform attention to every student in every moment.

If one student lags on a concept, there's rarely time to re-teach it for everyone.

And on the student side — two things happen:

First, hesitation: 'If I go to the teacher again and again, what will they say? What will they think?'

Second, timing: the teacher simply isn't there at 11 PM when the student is stuck on homework.

*(Point to the journey card)*

In class — 'I understood everything.' Later — 'Wait, what was that formula?' The student wants to ask… but holds back.

That's the gap. And that's what we set out to fill."

---

## Slide 3 — Our Solution

**~45 seconds**

"Our teachers are exceptional — Nova doesn't replace them.

T.E.A.C.H. is a **concept gap filler agent** — a bridge between the student and the teacher.

Student ↔ Nova ↔ Teacher.

When the teacher isn't there — after class, at home, late at night — Nova extends what the teacher started.

If a student didn't understand something in class — or forgot it while doing homework — they can come back anytime. 'What was that formula from today's lecture?' Nova explains it step by step, on a whiteboard, with voice — without judgment.

*(Point to dialogue)* 'Can you explain this?' 'Of course.' '…Again?' 'Of course.'

That's the personal attention teachers would love to give — whenever the student actually needs it."

---

## Slide 4 — How It Helps

**~50 seconds**

"Three modes — all built and working:

**Teach Me** — fill concept gaps with step-by-step whiteboard teaching.

**Ask a Doubt** — quick clarifications tied to what was taught in class.

**Voice Viva** — a light spoken check. The student isn't just watching videos or listening. Nova asks questions back. 'Where am I? Do I actually understand this?'

This drives **engagement** and **learner progress** — because learning becomes active, not passive.

We also see **summarisation** as a natural extension on the roadmap — helping students revise before exams.

And when a student says 'I just have ONE small doubt' — Nova turns that into a full teaching session. That's the power of structured teaching, not free-form chat."

---

## Slide 5 — Why It Works

**~40 seconds**

"Passive learning doesn't close gaps. Rewatching a lecture, reading notes alone — the student stays stuck.

Nova **teaches** — visually, with voice, at the student's pace. Then checks understanding with viva.

Under the hood: AWS Bedrock, Claude, Nova Sonic for voice viva, FastAPI, React. Structured prompts — not raw chat.

Serious engineering. Simple experience for the student."

---

## Slide 6 — Closing

**~25 seconds**

*(Pause. Slow down.)*

"Our teachers are exceptional.

But they can't be available every time, everywhere.

We believe **every student deserves access to one — anytime.**

Nova fills the gaps when teachers can't be there. Teachers stay at the centre.

Learning should never stop because the classroom did.

Thank you. We'd love to show you Nova live."

---

## Live demo cues (after slides)

Use **real topics from teach.db** — run `python3 scripts/export_presentation_data.py` to refresh slide 4 stats.

**Recommended demo topic:** **Newton Laws** (Physics) — 17 teach · 7 doubt · 3 viva sessions in DB  
**TOC:** First Law → Second Law

1. Pick **Newton Laws** from the catalog (same data as slide 4)
2. **Teach Me** — whiteboard + voice on First Law / Second Law
3. **Ask a Doubt** — "What was the formula for Newton's Second Law?"
4. **Voice Viva** — Nova asks; student answers
5. Close: "48 real sessions across 4 topics — this isn't a mockup."

---

## teach.db snapshot (refresh with export script)

| Metric | Value |
|--------|-------|
| Published topics | 4 |
| Learning sessions | 48 |
| Teach / Doubt / Viva | 28 / 12 / 8 |
| Featured demo | Newton Laws (Physics) |

---

## Language to use

- "Our teachers are exceptional — but they can't be everywhere, every time"
- "Concept gap filler" / "bridge between student and teacher"
- "Batch-level teaching" / "uniform attention"
- "Not replacing teachers — extending their reach"
- "Active learning" / "not just watching or listening"

## Language to avoid

- "Better than ChatGPT"
- "Replaces teachers"
- "100% personalized"
- Claiming summarisation is shipped (say "potential" / "roadmap")
