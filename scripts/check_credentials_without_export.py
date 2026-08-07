"""Verify AWS credentials resolve even when .env was never exported to the shell.

Reproduces the failure that surfaced as "Spoken vivas are unavailable right now":
the backend started with a plain `uvicorn app.main:app`, so .env was loaded into
pydantic settings but never into os.environ, and boto3 therefore found nothing.

Deliberately does NOT call load_dotenv() and scrubs any inherited AWS variables, so
the only way credentials can be found is via app.config's own export shim.

Usage:
    PYTHONPATH=. ./venv312/bin/python scripts/check_credentials_without_export.py
"""

from __future__ import annotations

import os
import sys

# Simulate a shell that never exported .env.
for name in (
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_SESSION_TOKEN",
    "AWS_DEFAULT_REGION",
    "AWS_REGION",
    "AWS_PROFILE",
):
    os.environ.pop(name, None)

print("environment scrubbed of all AWS_* variables")
print("(no load_dotenv() call — importing app.config is the only chance to resolve them)")
print()

from app.config import settings  # noqa: E402
from app.infrastructure.bedrock.bedrock_runtime_client import (  # noqa: E402
    has_aws_credentials,
    resolve_bedrock_region,
)

checks: dict[str, bool] = {}

key_id = os.environ.get("AWS_ACCESS_KEY_ID", "")
checks["credentials reached os.environ"] = key_id.strip() != ""
print(f"AWS_ACCESS_KEY_ID in env = {(key_id[:4] + '...' + key_id[-4:]) if key_id else '(empty)'}")

checks["has_aws_credentials() is True"] = has_aws_credentials()
print(f"has_aws_credentials()    = {has_aws_credentials()}")

region = resolve_bedrock_region()
checks["a region resolved"] = region.strip() != ""
print(f"resolve_bedrock_region() = {region}")
print(f"NOVA_SONIC_REGION        = {settings.NOVA_SONIC_REGION}")

# The Nova Sonic client resolves through boto3, so prove that path works too.
try:
    import boto3

    frozen = boto3.Session().get_credentials()
    resolved = frozen is not None and frozen.get_frozen_credentials().access_key is not None
except Exception as error:  # noqa: BLE001
    resolved = False
    print(f"boto3 session error: {error}")
checks["boto3 session resolves credentials"] = resolved
print(f"boto3 resolves creds     = {resolved}")

print()
for label, ok in checks.items():
    print(f"  {'OK  ' if ok else 'FAIL'} {label}")

failed = [label for label, ok in checks.items() if not ok]
print()
if failed:
    print("RESULT: FAIL — the voice viva would report itself unavailable")
    print("        Ensure .env contains AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY")
    sys.exit(1)
print("RESULT: PASS — credentials resolve without the shell exporting .env")
sys.exit(0)
