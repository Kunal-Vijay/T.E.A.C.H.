"""Confirm the Vite dev server proxies the viva WebSocket upgrade.

The browser talks to Vite on :5173, not the backend on :8000, so the /api proxy
needs `ws: true`. This checks the handshake actually reaches the backend by waiting
for the "ready" frame.

Usage:
    PYTHONPATH=. ./venv312/bin/python scripts/check_viva_ws_proxy.py --via backend
    PYTHONPATH=. ./venv312/bin/python scripts/check_viva_ws_proxy.py --via vite
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys

import httpx
import websockets

TARGETS = {"vite": 5173, "vite-alt": 5174, "backend": 8000}


async def check(port: int) -> int:
    # Sessions are always created against the backend; only the socket is proxied.
    with httpx.Client(base_url="http://localhost:8000", timeout=60) as client:
        topics = client.get("/api/v1/topics", params={"status": "published", "limit": 20}).json()
        items = topics["items"] if isinstance(topics, dict) and "items" in topics else topics
        usable = [t for t in items if len(t.get("toc_items", [])) > 0]
        if not usable:
            print("FAIL: no published topic. Run scripts/seed_demo_topic.py")
            return 1
        session_id = client.post(
            "/api/v1/learning-sessions",
            json={
                "topic_id": usable[0]["id"],
                "mode": "viva",
                "student_identifier": "ws-proxy-check",
            },
        ).json()["id"]

    url = f"ws://localhost:{port}/api/v1/learning-sessions/{session_id}/viva/voice"
    print(f"connecting to {url}")
    try:
        async with websockets.connect(url, max_size=None, open_timeout=25) as socket:
            raw = await asyncio.wait_for(socket.recv(), timeout=30)
            message = json.loads(raw)
            if message.get("type") == "ready":
                print(f"PASS  upgrade proxied on port {port}")
                print(f"      topic  = {message['topic_title']}")
                print(f"      limits = {message['max_questions']}Q / {message['max_seconds']}s")
                await socket.send(json.dumps({"type": "stop"}))
                return 0
            print(f"FAIL  first frame was not ready: {message}")
            return 1
    except Exception as error:  # noqa: BLE001
        print(f"FAIL  {type(error).__name__}: {error}")
        if port != 8000:
            print("      If this is the Vite dev server, make sure vite.config.ts has")
            print("      `ws: true` on the /api proxy, and restart it.")
        return 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--via", choices=sorted(TARGETS), default="vite")
    args = parser.parse_args()
    return asyncio.run(check(TARGETS[args.via]))


if __name__ == "__main__":
    sys.exit(main())
