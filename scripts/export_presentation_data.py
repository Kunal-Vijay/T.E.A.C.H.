#!/usr/bin/env python3
"""Export teach.db stats and topics for the hackathon presentation."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "teach.db"
OUT_PATH = ROOT / "presentation" / "demo-data.json"


def export() -> dict:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    topics = conn.execute(
        """
        SELECT id, title, subject, status
        FROM topics
        WHERE is_active = 1
        ORDER BY subject, title
        """
    ).fetchall()

    session_counts = conn.execute(
        """
        SELECT mode, COUNT(*) AS count
        FROM learning_sessions
        GROUP BY mode
        """
    ).fetchall()

    topic_sessions = conn.execute(
        """
        SELECT t.title, t.subject, ls.mode, COUNT(*) AS count
        FROM learning_sessions ls
        JOIN topics t ON t.id = ls.topic_id
        GROUP BY t.title, t.subject, ls.mode
        ORDER BY t.title, ls.mode
        """
    ).fetchall()

    featured_id = "00213282423143fe93ff9bc3ca832103"  # Newton Laws — most sessions
    toc = conn.execute(
        """
        SELECT title FROM topic_toc_items
        WHERE topic_id = ? AND is_active = 1
        ORDER BY "order"
        LIMIT 6
        """,
        (featured_id,),
    ).fetchall()

    featured = next((dict(r) for r in topics if r["id"] == featured_id), dict(topics[0]))

    conn.close()

    modes = {row["mode"].lower(): row["count"] for row in session_counts}
    total_sessions = sum(modes.values())

    return {
        "source": "teach.db",
        "stats": {
            "topics": len(topics),
            "sessions": total_sessions,
            "teach_sessions": modes.get("teach", 0),
            "doubt_sessions": modes.get("doubt", 0),
            "viva_sessions": modes.get("viva", 0),
        },
        "topics": [dict(r) for r in topics],
        "featured_topic": {
            "title": featured["title"],
            "subject": featured["subject"],
            "toc": [row["title"] for row in toc],
        },
        "topic_sessions": [dict(r) for r in topic_sessions],
    }


def main() -> None:
    data = export()
    OUT_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}")
    print(
        f"  {data['stats']['topics']} topics · "
        f"{data['stats']['sessions']} sessions · "
        f"featured: {data['featured_topic']['title']}"
    )


if __name__ == "__main__":
    main()
