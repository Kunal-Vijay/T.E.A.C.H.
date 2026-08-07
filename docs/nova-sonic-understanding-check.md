# Voice "Check Your Understanding" (Amazon Nova Sonic)

A student picks a topic they just studied and talks to a voice tutor about it. The
tutor is primed with that specific classroom's generated content and is instructed
to drive the student toward the right reasoning rather than hand over answers.

## Try it

```bash
# 1. Backend on the 3.12 venv (Nova Sonic needs Python 3.12+)
./scripts/start-backend.sh

# 2. Frontend
cd teach-frontend && npm run dev
```

Open http://localhost:5173 → **Continue as Student** → on any class card press
**Check understanding** → pick a topic → **Start talking** and allow the mic.

## Verifying without a browser

Three scripts, each isolating one layer:

```bash
# Are the AWS credentials valid and is the model available in this region?
./venv312/bin/python scripts/check_bedrock_access.py

# Does the Bedrock stream work at all? Speaks via macOS `say`, no mic needed.
PYTHONPATH=. ./venv312/bin/python scripts/smoke_nova_sonic.py
PYTHONPATH=. ./venv312/bin/python scripts/smoke_nova_sonic.py --print-prompt

# Does the WebSocket relay work? (backend must be running)
PYTHONPATH=. ./venv312/bin/python scripts/smoke_understanding_ws.py

# Does the Vite dev proxy forward the WS upgrade?
PYTHONPATH=. ./venv312/bin/python scripts/check_ws_proxy.py --via vite

# Prompt limits, turn detection and the interruption filter
PYTHONPATH=. ./venv312/bin/python scripts/check_understanding_changes.py

# Assessment output shape (no network needed)
PYTHONPATH=. ./venv312/bin/python scripts/check_assessment_parser.py

# The real assessment, end to end (backend must be running)
PYTHONPATH=. ./venv312/bin/python scripts/smoke_understanding_feedback.py

# Which text models can grade transcripts in your region?
./venv312/bin/python scripts/list_bedrock_text_models.py
```

To watch the Socratic guardrail hold under pressure:

```bash
PYTHONPATH=. ./venv312/bin/python scripts/smoke_nova_sonic.py \
  --say "Just tell me the answer, I do not want to guess."
```

## How it fits together

```
browser  ──16kHz PCM16──►  FastAPI /understanding-check/ws  ──►  Bedrock Nova Sonic
         ◄──24kHz PCM16──                                    ◄──
         ◄──transcript────
```

The backend has to sit in the middle: Nova Sonic needs a SigV4-signed long-lived
bidirectional HTTP/2 stream, and the browser cannot hold AWS credentials.

| Piece | File |
|---|---|
| Prompt assembly | `app/application/services/understanding_check_service.py` |
| Bedrock stream | `app/infrastructure/bedrock/nova_sonic_client.py` |
| REST + WebSocket | `app/presentation/routes/understanding_check_routes.py` |
| Mic capture / playback | `teach-frontend/src/lib/voice/novaSonicAudio.ts` |
| AudioWorklet | `teach-frontend/public/nova-mic-processor.js` |
| Session state | `teach-frontend/src/hooks/useUnderstandingCheck.ts` |
| UI | `teach-frontend/src/pages/student/UnderstandingCheckPage.tsx` |

## What goes into the prompt

`UnderstandingCheckService` builds roughly 18k characters per topic from data
already in the database:

- the teacher's base material and teaching notes (so emphasis carries over)
- every generated slide's text, walked in workflow-state order
- the spoken narration, so the tutor matches the vocabulary the student heard
- the pop quiz questions, told *not* to re-ask them verbatim
- the correct answers, marked "for your reference only, never say it"
- if a `classroom_session_id` is passed, which questions the student actually got
  wrong — those become the priority

Inspect the assembled prompt without burning a voice session:

```
GET /api/v1/understanding-check/generations/{generation_id}/topics/{topic_id}/prompt
```

## Endpoints

| Method | Path |
|---|---|
| GET | `/api/v1/understanding-check/health` |
| GET | `/api/v1/understanding-check/generations/{generation_id}/topics` |
| GET | `/api/v1/understanding-check/generations/{generation_id}/topics/{topic_id}/prompt` |
| POST | `/api/v1/understanding-check/feedback` |
| WS | `/api/v1/understanding-check/ws?generation_id=&topic_id=&classroom_session_id=` |

WebSocket frames, backend → browser:

| Type | Meaning |
|---|---|
| `ready` | stream open, carries prompt metadata and the exchange target |
| `transcript` | `{role: USER\|ASSISTANT, text}` |
| `audio` | base64 24 kHz mono PCM16 |
| `speech` | `{state: start\|end}` — student started/stopped talking |
| `interrupted` | student barged in; **drop all queued audio immediately** |
| `error` / `closed` | terminal |

Browser → backend: binary frames of 16 kHz mono PCM16, plus `{"type":"stop"}`.

## Keeping the tutor terse

The model will happily lecture if allowed to. Three things hold it back, and all
three matter:

1. `NOVA_SONIC_MAX_TOKENS` is 320. This is the blunt cap and the fastest way to
   undo the fix is to raise it.
2. The prompt caps each turn at two sentences / ~30 words / exactly one question,
   forbids preamble and praise, and forbids explaining anything. It includes
   worked good-vs-bad examples, which mattered more than the abstract rules.
3. The tutor is told *not* to deliver spoken closing feedback, because the written
   assessment covers it.

Measured effect on an identical student utterance: 4 tutor turns and ~19s of audio
before, 1 turn and ~3.2s after.

## Turn taking and barge-in

`sessionStart.turnDetectionConfiguration.endpointingSensitivity` controls how fast
the model decides the student has stopped. It defaults to `LOW` here — students
pause mid-explanation, and `HIGH` cuts them off. Set it via
`NOVA_SONIC_ENDPOINTING_SENSITIVITY`.

Barge-in needs client cooperation. Audio is generated faster than it plays, so when
the student interrupts there is a backlog already queued. Two triggers flush it:

- `speech` with `state: start` — fires locally, so it feels immediate
- `interrupted` — the authoritative server signal

Nova Sonic reports the interruption **in-band**, as a `textOutput` whose content is
the JSON `{"interrupted": true}`. It is a control message, not speech. The relay
filters it out via `is_interruption_text()` and re-emits it as a typed frame —
without that filter it renders in the transcript as a tutor turn reading
`{ "interrupted" : true }`.

## The written assessment

The voice tutor never explains or summarises, so the judgement happens afterwards
from the transcript. When the viva ends the UI posts the transcript to `/feedback`.
There is also a manual "Mark me now" button once at least one question is answered.

The response includes a scored rubric — five dimensions, 0-5 each, plus an overall
percentage. The dimensions are defined in one place, `RUBRIC_DIMENSIONS` in
`app/infrastructure/assessment_response_parser.py`, and both the prompt text and the
validation derive from it, so adding one means editing a single tuple:

| Dimension | What it separates |
|---|---|
| Conceptual accuracy | Were the facts right? |
| Depth of reasoning | Could they justify, or only state? |
| Use of terminology | Precise vocabulary, or vague gesturing? |
| Applying to new cases | Transfer beyond the lesson examples |
| Clarity of explanation | Structured, or scattered? |

The split matters: a student can score well on accuracy and terminology while
scoring badly on reasoning and transfer, and that gap is the useful signal. A
dimension the model omits is scored 0 with "Not demonstrated in this session."
rather than being dropped.

Provider resolution (`ASSESSMENT_PROVIDER=auto`):

1. **Bedrock** `amazon.nova-lite-v1:0` if AWS credentials exist — the default,
   since Nova Sonic already needs those credentials
2. **Gemini** if `GEMINI_API_KEY` is set
3. an offline placeholder, so the UI still works with nothing configured

The response grades `grasp_level` as solid/partial/shaky and returns
`understood_well`, `needs_work`, `misconceptions` (each paired with its correction —
the one place the system *does* state facts plainly) and `next_steps`.

Both providers run their output through
`app/infrastructure/assessment_response_parser.py`. Models asked for a list of
strings will sometimes return a list of objects; without flattening, those reach the
UI as Python dict reprs. `scripts/check_assessment_parser.py` locks that down.

## Things that will bite you

**The model ID is region-specific.** `us-west-2` serves
`amazon.nova-2-sonic-v1:0`. Using the v1 id `amazon.nova-sonic-v1:0` there fails
with "The provided model identifier is invalid". `check_bedrock_access.py` tells
you which is actually available.

**Python 3.12+ is mandatory** for `aws-sdk-bedrock-runtime`. The client imports it
lazily, so the app still boots on 3.11 — the voice feature just reports that the
SDK is missing. `/understanding-check/health` distinguishes the two cases.

**Temporary STS credentials expire.** The `.env` values are `ASIA`-prefixed with a
session token, good for a few hours. When sessions start failing to open, refresh
them.

**The Vite proxy needs `ws: true`.** Without it the upgrade request 404s and the
socket never opens. Already set in `vite.config.ts`.

**Nova Sonic drops the connection at 8 minutes.** The UI surfaces this as a normal
close so the student can restart. Reconnect-and-continue is not implemented.

**No authentication.** Same as the rest of this API. Anyone who can reach the port
can open a billable Bedrock stream. Fine locally; put auth in front of it before
exposing it anywhere shared.

## Not done

- **Nothing is persisted.** Neither the transcript nor the assessment is written to
  the database, so there is no session history and no teacher-facing report. This is
  the obvious next step given the teaching-assistant framing.
- The assessment is generated from the transcript the *browser* holds. Reloading
  mid-session loses it.
- No reconnect-and-continue at the 8 minute connection limit.
- The exchange target is a global setting, not per topic or per student.
