#!/usr/bin/env bash
# Fork workflow: push local main to your fork and open a PR to Kunal-Vijay/T.E.A.C.H.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPSTREAM="Kunal-Vijay/T.E.A.C.H."
BRANCH="${1:-main}"

cd "$REPO_ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Log in to GitHub first:"
  echo "  gh auth login"
  exit 1
fi

GITHUB_USER="$(gh api user -q .login)"
FORK_REPO="${GITHUB_USER}/T.E.A.C.H."

echo "GitHub user: ${GITHUB_USER}"

if ! gh repo view "${FORK_REPO}" >/dev/null 2>&1; then
  echo "Creating fork ${FORK_REPO}..."
  gh repo fork "${UPSTREAM}" --clone=false
else
  echo "Fork already exists: https://github.com/${FORK_REPO}"
fi

git remote set-url origin "https://github.com/${FORK_REPO}.git"
if ! git remote get-url upstream >/dev/null 2>&1; then
  git remote add upstream "https://github.com/${UPSTREAM}.git"
fi

echo "Pushing ${BRANCH} to origin..."
git push -u origin "${BRANCH}"

echo "Creating pull request..."
gh pr create \
  --repo "${UPSTREAM}" \
  --head "${GITHUB_USER}:${BRANCH}" \
  --base main \
  --title "Sync changes from ${GITHUB_USER}" \
  --body "$(cat <<EOF
## Summary
Pushes local work from fork \`${FORK_REPO}\` to upstream \`${UPSTREAM}\`.

## Test plan
- [ ] Review changed files
- [ ] CI passes (if configured)
EOF
)"

echo "Done."
