"""Confirm the Vite dev server proxies the Nova Sonic WebSocket upgrade.

The browser talks to Vite on :5173, not the backend on :8000, so the proxy needs
`ws: true`. This checks the handshake actually reaches the backend by waiting for
the "ready" frame.

Usage:
    ./venv312/bin/python scripts/check_ws_proxy.py --via backend   # straight to FastAPI
    ./venv312/bin/python scripts/check_ws_proxy.py --via vite      # the path the browser takes
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys

import httpx
import websockets


async def check(port: int) -> int:
    async with httpx.AsyncClient(base_url=f"http://localhost:{port}", timeout=30) as client:
        plans = (await client.get("/api/v1/class-plans", params={"page": 1, "limit": 50})).json()
        target = None
        for plan in plans["items"]:
            generations = (
                await client.get(f"/api/v1/class-plans/{plan['plan_id']}/generations")
            ).json()
            for generation in generations["items"]:
                if generation["status"] not in {"completed", "completed_with_warnings"}:
                    continue
                topics = (
                    await client.get(
                        f"/api/v1/understanding-check/generations/{generation['generation_id']}/topics"
                    )
                ).json()
                for topic in topics["topics"]:
                    if topic["slide_count"] > 0:
                        target = (generation["generation_id"], topic["topic_id"])
                        break
                if target:
                    break
            if target:
                break

    if target is None:
        print("FAIL: no completed generation with slides available")
        return 1

    generation_id, topic_id = target
    url = (
        f"ws://localhost:{port}/api/v1/understanding-check/ws"
        f"?generation_id={generation_id}&topic_id={topic_id}"
    )
    print(f"connecting to {url}")

    try:
        async with websockets.connect(url, max_size=None, open_timeout=20) as socket:
            raw = await asyncio.wait_for(socket.recv(), timeout=30)
            message = json.loads(raw)
            if message.get("type") == "ready":
                print(f"PASS  upgrade proxied on port {port}; got ready for '{message['topic_title']}'")
                print(f"      prompt chars = {message['prompt_character_count']}")
                await socket.send(json.dumps({"type": "stop"}))
                return 0
            print(f"FAIL  first frame was not ready: {message}")
            return 1
    except Exception as error:  # noqa: BLE001
        print(f"FAIL  {type(error).__name__}: {error}")
        if port != 8000:
            print("      If this is the Vite dev server, restart it so vite.config.ts")
            print("      picks up `ws: true` on the /api proxy.")
        return 1


TARGETS = {"vite": 5173, "vite-alt": 5174, "backend": 8000}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--via", choices=sorted(TARGETS), default="vite")
    args = parser.parse_args()
    return asyncio.run(check(TARGETS[args.via]))


if __name__ == "__main__":
    sys.exit(main())
