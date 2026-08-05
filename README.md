# TEACH — AI Tutor Platform

**Teacherless Education through Autonomous Cognitive Heuristics**

TEACH is an AI-powered classroom platform. Admins create and publish class plans, trigger Gemini-based content generation (slides, workflow, pop quiz), and students attend live sessions with an AI teacher avatar, SAGE doubt resolution, and interactive workflow states.

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

Optional: [pyenv](https://github.com/pyenv/pyenv) for Python version management (used by the bundled start script).

You also need a [Google Gemini API key](https://aistudio.google.com/apikey) for class generation and SAGE doubt responses.

## Project structure

```
ai_tutor/
├── app/                  # FastAPI backend (onion architecture)
├── teach-frontend/       # React + Vite frontend
├── scripts/              # Backend start script and DB init
├── .env                  # Backend environment (create from .env.example)
└── teach.db              # SQLite database (auto-created on first start)
```

## Setup

### 1. Clone and enter the project

```bash
cd ai_tutor
```

### 2. Backend

#### Create a virtual environment

Using pyenv (matches `scripts/start-backend.sh`):

```bash
pyenv install 3.11.15
pyenv virtualenv 3.11.15 teach-venv
pyenv local teach-venv   # optional
```

Or with the standard venv module:

```bash
python3.11 -m venv venv
source venv/bin/activate
```

#### Install Python dependencies

```bash
pip install \
  fastapi uvicorn sqlalchemy pydantic pydantic-settings \
  google-genai gTTS mangum alembic python-multipart \
  boto3 httpx python-dotenv
```

#### Configure environment

Copy the example env file and add your Gemini key:

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
SYNC_GENERATION=true
LOG_LEVEL=INFO
```

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite / Postgres connection string | `sqlite:///./teach.db` |
| `GEMINI_API_KEY` | Required for class generation and SAGE | — |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `SYNC_GENERATION` | Run generation in-process when `true` | `true` |
| `FRONTEND_ORIGIN` | CORS allowed origin | `http://localhost:5173` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |

#### Initialize the database

The start script creates the DB automatically. To init manually:

```bash
export PYTHONPATH=.
python scripts/init_db.py
```

### 3. Frontend

```bash
cd teach-frontend
npm install
```

The frontend proxies `/api` and `/health` to `http://localhost:8000` via Vite, so no frontend `.env` is required for local development. Leave `VITE_API_BASE_URL` empty in `teach-frontend/.env`.

## Start the project

Run backend and frontend in **two separate terminals**.

### Terminal 1 — Backend (port 8000)

From the project root:

```bash
./scripts/start-backend.sh
```

Or manually:

```bash
source ~/.pyenv/versions/3.11.15/envs/teach-venv/bin/activate   # or: source venv/bin/activate
source .env
export PYTHONPATH=.
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify: [http://localhost:8000/health](http://localhost:8000/health) → `{"status":"ok"}`

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Terminal 2 — Frontend (port 5173)

```bash
cd teach-frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Usage flow

### Admin (Teacher)

1. Open the app → **Continue as Teacher**
2. **Create Class** — fill subject, topics, base material, and notes
3. **Publish** the class plan
4. **Generate Class** — triggers Gemini workflow generation (requires `GEMINI_API_KEY`)
5. Wait until generation status is **completed**

### Student

1. Open the app → **Continue as Student**
2. Pick a ready class from the catalog
3. **Attend Class** — starts a classroom session
4. Follow the AI teacher workflow: slides, predictions, pop quiz, and SAGE doubts

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `teach-venv not found` | Create the pyenv virtualenv (see Backend setup) or edit `scripts/start-backend.sh` to point to your venv |
| Generation fails immediately | Ensure `GEMINI_API_KEY` is set in root `.env`, not `teach-frontend/.env` |
| Attend Class returns 500 | Restart the backend after pulling latest changes; regenerate the class if workflow data is stale |
| Frontend cannot reach API | Confirm backend is running on port 8000; Vite proxy handles `/api` in dev |
| SAGE gives generic replies | Same as generation — `GEMINI_API_KEY` must be set in root `.env` |

## Development

```bash
# Backend tests (if added)
pytest

# Frontend production build
cd teach-frontend && npm run build
```

Backend logs request/response bodies (truncated) when `LOG_LEVEL=INFO`.
