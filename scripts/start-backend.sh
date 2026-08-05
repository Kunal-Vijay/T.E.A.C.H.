#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VENV_PATH="${HOME}/.pyenv/versions/3.11.15/envs/teach-venv"
if [ -f "${VENV_PATH}/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "${VENV_PATH}/bin/activate"
else
  echo "teach-venv not found. Create it with: pyenv virtualenv 3.11.15 teach-venv"
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
  python scripts/init_db.py
fi

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
