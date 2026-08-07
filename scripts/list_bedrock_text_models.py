"""List Bedrock text models available in the configured region."""

from __future__ import annotations

import os

import boto3
from dotenv import load_dotenv

load_dotenv()

REGION = os.environ.get("AWS_REGION", "us-west-2")

session = boto3.Session(region_name=REGION)
models = session.client("bedrock").list_foundation_models()["modelSummaries"]

candidates = [
    m
    for m in models
    if "TEXT" in m.get("outputModalities", [])
    and "TEXT" in m.get("inputModalities", [])
    and m.get("modelLifecycle", {}).get("status") == "ACTIVE"
]

print(f"{len(candidates)} active text->text models in {REGION}\n")
for m in sorted(candidates, key=lambda x: x["modelId"]):
    inference = ",".join(m.get("inferenceTypesSupported", []))
    print(f"  {m['modelId']:<52} {inference}")

print("\n--- likely assessment candidates ---")
for needle in ("nova-lite", "nova-pro", "nova-micro", "claude-3-5-haiku", "claude-3-haiku"):
    hits = [m["modelId"] for m in candidates if needle in m["modelId"]]
    for hit in hits:
        types = next(m.get("inferenceTypesSupported", []) for m in candidates if m["modelId"] == hit)
        print(f"  {hit:<52} {','.join(types)}")
