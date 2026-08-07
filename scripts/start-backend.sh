#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f "${ROOT_DIR}/venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/venv/bin/activate"
elif [ -f "${HOME}/.pyenv/versions/3.11.15/envs/teach-venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "${HOME}/.pyenv/versions/3.11.15/envs/teach-venv/bin/activate"
else
  echo "No Python venv found. Create one with: python3.12 -m venv venv"
  exit 1
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export PYTHONPATH="$ROOT_DIR"

if [ ! -f teach.db ]; then
  if [ -f teach_dump.sql ]; then
    sqlite3 teach.db < teach_dump.sql
    echo "Database restored from teach_dump.sql"
  fi
fi

python scripts/init_db.py

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
