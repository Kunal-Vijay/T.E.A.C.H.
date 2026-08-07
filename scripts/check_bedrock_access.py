"""Preflight check for the Nova Sonic prototype.

Verifies that the AWS credentials in .env are valid and that the Nova Sonic
model is listed in the configured region. Prints no secret values.

Usage:
    ./venv312/bin/python scripts/check_bedrock_access.py
"""

from __future__ import annotations

import os
import sys

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv

load_dotenv()

REGION = os.environ.get("AWS_REGION", "us-west-2")
MODEL_ID = os.environ.get("NOVA_SONIC_MODEL_ID", "amazon.nova-sonic-v1:0")


def main() -> int:
    key_id = os.environ.get("AWS_ACCESS_KEY_ID", "")
    if key_id == "":
        print("FAIL: AWS_ACCESS_KEY_ID is not set (check .env)")
        return 1

    print(f"region                 = {REGION}")
    print(f"access key id          = {key_id[:4]}...{key_id[-4:]} (len {len(key_id)})")
    print(f"session token present  = {os.environ.get('AWS_SESSION_TOKEN', '') != ''}")
    print(f"target model           = {MODEL_ID}")
    print()

    session = boto3.Session(region_name=REGION)

    try:
        identity = session.client("sts").get_caller_identity()
    except (ClientError, NoCredentialsError) as error:
        print(f"FAIL: STS get_caller_identity -> {error}")
        print("      Credentials are likely expired. Refresh them in .env.")
        return 1
    print(f"OK  STS identity       = account {identity['Account']}, arn {identity['Arn']}")

    try:
        models = session.client("bedrock").list_foundation_models()["modelSummaries"]
    except ClientError as error:
        print(f"FAIL: bedrock list_foundation_models -> {error}")
        return 1

    sonic = [m for m in models if "sonic" in m["modelId"].lower()]
    print(f"OK  bedrock reachable  = {len(models)} models visible in {REGION}")
    if sonic == []:
        print(f"WARN no sonic model found in {REGION}. Available regions differ per model.")
    for model in sonic:
        streaming = model.get("responseStreamingSupported", False)
        print(
            f"     - {model['modelId']:<34} in={','.join(model.get('inputModalities', []))} "
            f"out={','.join(model.get('outputModalities', []))} streaming={streaming}"
        )

    exact = [m for m in models if m["modelId"] == MODEL_ID]
    print()
    if exact:
        print(f"OK  {MODEL_ID} is available in {REGION}")
        return 0
    print(f"FAIL {MODEL_ID} is NOT available in {REGION}")
    print("     Set NOVA_SONIC_MODEL_ID / AWS_REGION in .env to a supported combination.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
