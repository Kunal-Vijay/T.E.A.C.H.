#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# The Nova Sonic voice feature needs Python 3.12+ (aws-sdk-bedrock-runtime floor),
# so venv312 is preferred. Falls back to any other local venv, then to pyenv.
CANDIDATES=(
  "${ROOT_DIR}/venv312"
  "${ROOT_DIR}/venv"
  "${ROOT_DIR}/.venv"
  "${HOME}/.pyenv/versions/3.11.15/envs/teach-venv"
)

VENV_PATH=""
for candidate in "${CANDIDATES[@]}"; do
  if [ -f "${candidate}/bin/activate" ]; then
    VENV_PATH="${candidate}"
    break
  fi
done

if [ -z "${VENV_PATH}" ]; then
  echo "No virtualenv found. Create one with:"
  echo "  python3.12 -m venv venv312 && ./venv312/bin/python -m pip install -r requirements.txt"
  exit 1
fi

# shellcheck disable=SC1091
source "${VENV_PATH}/bin/activate"
echo "Using $(python --version) from ${VENV_PATH}"

if ! python -c "import aws_sdk_bedrock_runtime" 2>/dev/null; then
  echo "WARNING: aws-sdk-bedrock-runtime is not importable in this env."
  echo "         The voice understanding check will be unavailable (needs Python 3.12+)."
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
