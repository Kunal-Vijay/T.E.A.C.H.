# T.E.A.C.H. — Hackathon Speaker Notes

**Total time:** ~8 minutes (slides ~4 min · live demo ~4 min)  
**Audience:** Infinity Learn leadership, product, engineering, judges  
**Core narrative:** Assistants answer. Teachers build understanding.

---

## Slide 1 — Title · T.E.A.C.H.

**~45 seconds**

*(Pause. Make eye contact. Don't rush into tech.)*

"We asked ourselves one simple question.

When a live class ends… does learning end too?

For millions of students, it often does. Videos stop. Teachers leave. Homework begins. Doubts remain.

Infinity Learn already has an excellent assistant that helps students get answers. We explored the next evolution.

What if every student had a personal teacher — not just an assistant — that stayed with them after class?

Not just to answer questions… but to actually teach.

That's T.E.A.C.H. — Teacherless Education through Autonomous Cognitive Heuristics.

Learning shouldn't stop when class ends. That's our tagline, and it's the reason we built this."

---

## Slide 2 — The Problem

**~50 seconds**

"Let's be honest about what post-class learning looks like today.

Students have recorded videos — they watch, pause, rewind, and often stay confused.

They have notes — information on a page, not understanding in the mind.

And they have chat-based doubt solving — which is genuinely helpful. Students get answers quickly.

But answers aren't the same as teaching.

An answer closes a question. Teaching opens understanding.

Students receive information. They are rarely taught continuously — step by step, visually, at their pace, with someone who stays in the session with them.

That's the gap we set out to explore."

---

## Slide 3 — Our Vision

**~55 seconds**

"Our vision is simple to say and hard to build:

What if every student had a personal teacher available anytime?

Not a chatbot. A teacher.

In T.E.A.C.H., that teacher is Nova.

Nova explains concepts on an interactive whiteboard. Nova narrates lessons with natural voice. Nova adapts to each student's pace, depth, and learning style.

Nova teaches. Nova answers doubts. Nova checks understanding through a spoken viva.

Students don't just consume content — they enter a live teaching session that continues long after the classroom ends.

Explains. Adapts. Teaches. Revises. Visual learning. Voice. All in one experience."

---

## Slide 4 — How T.E.A.C.H. Works

**~50 seconds**

"Here's the flow — intentionally simple.

A student picks a published topic from the catalog. They choose a mode: Teach Me, Ask a Doubt, or Check Understanding.

Nova takes over.

Behind Nova is a teaching engine powered by AWS Bedrock — structured prompts that generate each teaching turn, not free-form chat.

Lesson intelligence is driven by a table of contents — Nova progresses through topics systematically in Teach mode.

Each turn produces visual slides on an interactive whiteboard — headings, bullet points, LaTeX for math.

Google Cloud TTS narrates every explanation, synced with live subtitles.

Students converse via chat or voice input. And the entire session adapts to their preferences — explanation depth, pace, interaction style.

It's a closed loop: topic → teacher → board → voice → conversation → adaptation."

---

## Slide 5 — Product Features

**~45 seconds**

"Every feature on this slide is built and working — not a roadmap slide disguised as product.

Interactive whiteboard with marker-style chalk animations. Natural voice narration. Live teaching sessions.

Adaptive learning preferences — students can tune explanation depth, pace, and how Nova interacts before each session.

Visual slide explanations with structured content. Ask Doubts mode for topic-bound doubt resolution.

Lesson continuation tracked against the table of contents. Local learning progress across topics.

Three teaching modes: Teach, Doubt, and Viva.

Context-aware conversations — Nova knows the topic, the student's profile, and the full conversation history.

Voice input via speech-to-text. And Voice Viva — a spoken understanding check powered by Amazon Nova Sonic, with a detailed assessment report at the end.

We focused on building a teaching experience, not another chatbot."

---

## Slide 6 — Why This Feels Different

**~55 seconds**

"I'm not here to compare products or criticize what exists. Infinity Learn's assistant ecosystem is excellent at what it does — getting students answers, fast.

The question we explored is different: what happens after the answer?

A traditional assistant answers a question and the conversation ends.

T.E.A.C.H. teaches a concept. Nova walks through it on a whiteboard. Narrates it with voice. Adapts to the student's pace. Stays in the session. Lets the student ask follow-ups in Doubt mode. Checks understanding in Viva mode.

Assistants answer. Teachers build understanding.

That's the shift — from answering questions to creating understanding.

And when you watch Nova teach live — with the board writing in, the voice narrating, the subtitles syncing — it genuinely feels like a teacher, not a chat window."

---

## Slide 7 — Technology

**~40 seconds**

"Quick technology overview — because judges will ask.

Frontend: React and Vite — a premium, responsive classroom UI with four themes and six ambient environments.

Backend: FastAPI with a clean layered architecture — presentation, application, domain, infrastructure.

Intelligence: AWS Bedrock with Claude Sonnet — structured tool calls for every teach, doubt, and viva turn. Prompt engineering is the core IP, not raw chat.

Voice: Google Cloud TTS for lesson narration. Amazon Nova Sonic for spoken viva — real-time bidirectional speech.

Session management with persistent turns, visuals, and student preference snapshots.

We kept the stack focused. Every layer serves the teaching experience."

---

## Slide 8 — Live Demo

**~30 seconds on slide · then switch to app for ~4 minutes**

"Let me show you Nova in action.

*(Switch to http://localhost:5173)*

**Demo script:**

1. **Welcome screen** — 'Nova teaches. Students learn.' Pick Continue as Student.
2. **Topic catalog** — Open any published topic. Show the TOC timeline.
3. **Topic Session Modal** — Select **Teach Me**. Optionally expand Advanced Settings to show adaptive preferences (pace, depth, interaction mode). Start session.
4. **Loading screen** — Nova preparing the first lesson turn. Mention this is Bedrock generating structured slides.
5. **Live classroom** — Point out: whiteboard on the left, Nova on the right with live subtitles. Voice narration auto-plays. Show slide progression and progress bar in the header.
6. **Ask a doubt** — Type or use the mic: 'Can you explain this differently?' Show Nova thinking → explaining on the board.
7. **Switch to Doubt mode** (new session) — Show topic-bound doubt resolution.
8. **Optional: Viva** — Start Check Understanding. Show spoken examination and assessment report with score, rubric, and learning plan.

Keep narration minimal during demo. Let the product speak."

---

## Slide 9 — Future Work

**~40 seconds**

"We're honest about what's next — these are not built yet.

Interactive whiteboard drawing — pen, eraser, undo are stubbed in the UI today.

Live bidirectional voice in Teach and Doubt — currently students use speech-to-text input and Nova responds with TTS; Viva already has full voice conversation via Nova Sonic.

Teacher dashboard and class plan publishing — backend exists but isn't wired to the current student-facing app.

AI-generated diagram assets — the image pipeline is stubbed.

Memory across subjects and sessions, multilingual teaching, parent insights — natural extensions of the student profile system we already have.

We label these clearly as future work because credibility matters more than a crowded slide."

---

## Slide 10 — Closing

**~50 seconds**

*(Slow down. This is the moment they remember.)*

"We don't believe technology should replace teachers.

We believe every student deserves one.

Not every student gets a personal tutor. Not every student can ask their teacher at 11 PM before an exam. Not every student gets a second explanation when the first one didn't land.

T.E.A.C.H. is our exploration of what happens when post-class learning feels like having a teacher — not opening a chat window.

Nova teaches. Students learn.

Learning should never stop because the classroom did.

Thank you — we'd love your questions, and we're excited to show you more."

---

## Timing Cheat Sheet

| Segment | Duration |
|---------|----------|
| Slides 1–7 | ~5 min |
| Slide 8 intro + live demo | ~4 min |
| Slides 9–10 (after demo) | ~1.5 min |
| **Total** | **~8–10 min** |

## Demo Fallbacks

| Issue | Fallback |
|-------|----------|
| Bedrock slow on first turn | Show loading screen copy; mention background generation |
| TTS fails | Subtitles still work; narrate manually |
| No published topics | Pre-publish one topic before presenting |
| Viva voice unavailable | Show Teach + Doubt only; mention Viva as voice mode |

## Key Phrases to Use

- "The next evolution" — not "better than"
- "Building understanding" — not "better chatbot"
- "Nova teaches" — not "AI tutor"
- "Teaching experience" — not "AI product"
- "Infinity Learn already has an excellent assistant" — acknowledge existing work

## Key Phrases to Avoid

- Better than AINA / replace AINA
- AI is bad / existing AI is broken
- Chatbot / copilot / assistant (when describing T.E.A.C.H.)

---

## Opening the Presentation

```bash
open presentation/index.html
# or
cd presentation && python3 -m http.server 8765
# then open http://localhost:8765
```

Navigate with **→** / **←** arrow keys or on-screen buttons.
