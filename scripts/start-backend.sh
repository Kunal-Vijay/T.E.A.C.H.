#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# venv312 is preferred: the Nova Sonic voice viva needs Python 3.12+ because
# aws-sdk-bedrock-runtime (bidirectional streaming) sets that floor.
if [ -f "${ROOT_DIR}/venv312/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/venv312/bin/activate"
elif [ -f "${ROOT_DIR}/venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/venv/bin/activate"
elif [ -f "${HOME}/.pyenv/versions/3.11.15/envs/teach-venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "${HOME}/.pyenv/versions/3.11.15/envs/teach-venv/bin/activate"
else
  echo "No Python venv found. Create one with:"
  echo "  python3.12 -m venv venv312 && ./venv312/bin/python -m pip install -r requirements.txt"
  exit 1
fi
echo "Using $(python --version)"

if ! python -c "import aws_sdk_bedrock_runtime" 2>/dev/null; then
  echo "WARNING: aws-sdk-bedrock-runtime is not importable in this env."
  echo "         The spoken viva will be unavailable (it needs Python 3.12+)."
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
    python -c "
import sqlite3
from pathlib import Path

dump_sql = Path('teach_dump.sql').read_text(encoding='utf-8')
connection = sqlite3.connect('teach.db')
connection.executescript(dump_sql)
connection.close()
"
    echo "Database restored from teach_dump.sql"
  fi
  python scripts/init_db.py
fi

python scripts/init_db.py

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
