#!/usr/bin/env python3
"""Replace hardcoded colors in CSS with theme token variables."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src" / "styles"
SKIP = {"themes/palette.css", "mentor.css"}

# Longest-first replacement map (exact string matches)
REPLACEMENTS: list[tuple[str, str]] = [
    # Gradients & complex values first
    ("linear-gradient(180deg, #1e293b 0%, var(--color-primary) 100%)", "var(--grad-hub-primary)"),
    ("linear-gradient(180deg, #ffffff 0%, #fafaf9 100%)", "var(--grad-surface)"),
    ("linear-gradient(180deg, #f0fdfa 0%, var(--color-accent-mid) 120%)", "var(--grad-accent-soft-panel)"),
    ("linear-gradient(135deg, #fffbeb 0%, var(--color-highlight-soft) 100%)", "var(--grad-celebrate)"),
    ("linear-gradient(135deg, rgba(20, 184, 166, 0.18), rgba(20, 184, 166, 0.08))", "var(--grad-accent-chip)"),
    ("linear-gradient(165deg, rgba(255, 255, 255, 0.97) 0%, rgba(250, 250, 249, 0.94) 100%)", "var(--grad-board-light)"),
    ("linear-gradient(165deg, rgba(255, 255, 255, 0.96) 0%, rgba(250, 250, 249, 0.92) 100%)", "var(--grad-board-light-soft)"),
    ("linear-gradient(165deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 0.62) 38%)", "var(--grad-glass-panel)"),
    ("linear-gradient(165deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 0.55) 42%)", "var(--grad-glass-card)"),
    ("linear-gradient(165deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 0.55) 38%)", "var(--hub-gradient-panel)"),
    ("linear-gradient(165deg, rgba(255, 255, 255, 0.06) 0%, rgba(15, 23, 42, 0.55) 38%)", "var(--hub-gradient-panel)"),
    ("linear-gradient(165deg, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.48) 100%)", "var(--grad-hub-surface)"),
    ("linear-gradient(165deg, rgba(15, 23, 42, 0.52) 0%, rgba(15, 23, 42, 0.38) 100%)", "var(--grad-board-dark)"),
    ("linear-gradient(180deg, rgba(8, 12, 22, 0.55) 0%, rgba(6, 8, 15, 0.38) 100%)", "var(--grad-mentor-panel)"),
    ("linear-gradient(180deg, transparent 0%, rgba(6, 8, 15, 0.45) 100%)", "var(--grad-footer-scrim)"),
    ("linear-gradient(180deg, rgba(20, 184, 166, 0.35) 0%, rgba(15, 118, 110, 0.85) 100%)", "var(--grad-accent-solid)"),
    ("linear-gradient(135deg, var(--hub-accent-soft-strong) 0%, rgba(15, 23, 42, 0.65) 55%)", "var(--grad-featured-card)"),
    ("linear-gradient(135deg, rgba(241, 245, 249, 0.95), rgba(248, 250, 252, 0.85))", "var(--grad-slate-wash)"),
    ("linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.88) 100%)", "var(--grad-slate-panel)"),
    ("radial-gradient(circle, rgba(20, 184, 166, 0.26) 0%, transparent 68%)", "var(--gradient-ambient-teal)"),
    ("radial-gradient(circle, rgba(20, 184, 166, 0.32) 0%, transparent 65%)", "var(--gradient-ambient-teal-strong)"),
    ("radial-gradient(circle, rgba(245, 158, 11, 0.11) 0%, transparent 70%)", "var(--gradient-ambient-amber)"),
    ("radial-gradient(ellipse 85% 55% at 50% 0%, rgba(20, 184, 166, 0.14), transparent 68%)", "var(--gradient-board-glow)"),
    ("radial-gradient(ellipse 80% 60% at 50% 40%, rgba(20, 184, 166, 0.1), transparent 65%)", "var(--gradient-stage-glow)"),

    # Box shadows
    ("0 24px 64px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06) inset, 0 0 80px rgba(20, 184, 166, 0.08)", "var(--shadow-board-hero)"),
    ("0 20px 56px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)", "var(--shadow-hub-onboarding)"),
    ("0 20px 56px rgba(0, 0, 0, 0.35), inset 0 1px 0 var(--hub-inset-highlight)", "var(--shadow-hub-onboarding)"),
    ("0 16px 48px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.05)", "var(--shadow-hub-panel)"),
    ("0 16px 44px rgba(0, 0, 0, 0.32)", "var(--shadow-elevated-md)"),
    ("0 12px 40px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08)", "var(--shadow-board-card)"),
    ("0 12px 36px rgba(0, 0, 0, 0.35), 0 0 32px rgba(20, 184, 166, 0.18)", "var(--shadow-accent-lg)"),
    ("0 12px 36px rgba(0, 0, 0, 0.4), 0 0 32px rgba(20, 184, 166, 0.2)", "var(--shadow-accent-lg-strong)"),
    ("0 10px 32px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04)", "var(--shadow-glass-card)"),
    ("0 10px 22px rgba(20, 184, 166, 0.22)", "var(--shadow-accent-sm)"),
    ("0 8px 28px rgba(0, 0, 0, 0.35), 0 0 24px rgba(20, 184, 166, 0.12)", "var(--shadow-hub-btn-accent)"),
    ("0 8px 28px rgba(0, 0, 0, 0.35), 0 0 28px rgba(20, 184, 166, 0.18)", "var(--shadow-hub-btn-hover)"),
    ("0 8px 28px rgba(0, 0, 0, 0.22), inset 0 1px 0 var(--hub-inset-highlight)", "var(--shadow-stat-pill)"),
    ("0 8px 20px rgba(20, 184, 166, 0.32)", "var(--shadow-accent-md)"),
    ("0 8px 20px rgba(251, 191, 36, 0.25)", "var(--shadow-highlight-md)"),
    ("0 6px 24px rgba(0, 0, 0, 0.25), 0 0 20px rgba(20, 184, 166, 0.12)", "var(--shadow-hub-btn-soft)"),
    ("0 6px 20px rgba(0, 0, 0, 0.3), 0 0 20px rgba(20, 184, 166, 0.12)", "var(--shadow-hub-btn-soft)"),
    ("0 4px 16px rgba(0, 0, 0, 0.25)", "var(--shadow-elevated-sm)"),
    ("0 4px 16px rgba(20, 184, 166, 0.08)", "var(--shadow-accent-xs)"),
    ("0 1px 2px rgba(15, 23, 42, 0.04)", "var(--shadow-ink-xs)"),
    ("0 8px 28px rgba(15, 23, 42, 0.07)", "var(--shadow-board)"),
    ("0 0 12px color-mix(in srgb, var(--mentor-glow, var(--color-accent)) 45%, transparent)", "0 0 12px color-mix(in srgb, var(--mentor-glow, var(--color-accent)) 45%, transparent)"),
    ("0 0 8px rgba(20, 184, 166, 0.65)", "0 0 8px var(--hub-accent-pulse)"),
    ("0 0 0 3px rgba(255, 255, 255, 0.32), 0 0 10px rgba(255, 255, 255, 0.45)", "var(--shadow-white-ring)"),

    # color-mix fallbacks
    ("var(--mentor-glow, #14b8a6)", "var(--mentor-glow, var(--color-accent))"),
    ("var(--mentor-accent, #14b8a6)", "var(--mentor-accent, var(--color-accent))"),
    ("var(--mentor-accent, #5eead4)", "var(--mentor-accent, var(--hub-accent))"),
    ("var(--mentor-glow, #5eead4)", "var(--mentor-glow, var(--hub-accent))"),
    ("color-mix(in srgb, var(--mentor-accent, var(--color-accent))", "color-mix(in srgb, var(--mentor-accent, var(--color-accent))"),

    # rgba - hub text
    ("rgba(248, 250, 252, 0.96)", "var(--hub-text-strong)"),
    ("rgba(248, 250, 252, 0.95)", "var(--hub-text-strong)"),
    ("rgba(248, 250, 252, 0.94)", "var(--hub-text-strong)"),
    ("rgba(248, 250, 252, 0.92)", "var(--hub-text-emphasis)"),
    ("rgba(248, 250, 252, 0.88)", "var(--hub-text-emphasis)"),
    ("rgba(248, 250, 252, 0.85)", "var(--hub-text-body)"),
    ("rgba(248, 250, 252, 0.82)", "var(--hub-text-body)"),
    ("rgba(248, 250, 252, 0.78)", "var(--hub-text-medium)"),
    ("rgba(248, 250, 252, 0.72)", "var(--hub-text-soft)"),
    ("rgba(248, 250, 252, 0.62)", "var(--hub-text-secondary)"),
    ("rgba(248, 250, 252, 0.58)", "var(--hub-text-secondary)"),
    ("rgba(248, 250, 252, 0.55)", "var(--hub-text-subtle)"),
    ("rgba(248, 250, 252, 0.48)", "var(--hub-text-dim)"),
    ("rgba(248, 250, 252, 0.45)", "var(--hub-text-muted)"),
    ("rgba(248, 250, 252, 0.42)", "var(--hub-text-ghost)"),
    ("rgba(248, 250, 252, 0.38)", "var(--hub-text-faint)"),
    ("rgba(248, 250, 252, 0.32)", "var(--hub-text-faint)"),
    ("rgba(248, 250, 252, 0.25)", "var(--hub-text-whisper)"),
    ("rgba(248, 250, 252, 0.22)", "var(--hub-border-hover)"),
    ("rgba(248, 250, 252, 0.14)", "var(--hub-border-muted)"),
    ("rgba(248, 250, 252, 0.12)", "var(--hub-border-strong)"),
    ("rgba(248, 250, 252, 0.1)", "var(--hub-border)"),
    ("rgba(248, 250, 252, 0.08)", "var(--hub-border-subtle)"),
    ("rgba(248, 250, 252, 0.06)", "var(--hub-border-faint)"),
    ("rgba(248, 250, 252, 0.05)", "var(--hub-overlay-light)"),
    ("rgba(248, 250, 252, 0.04)", "var(--hub-border-ghost)"),
    ("rgba(248, 250, 252, 0.025)", "var(--hub-grid-faint)"),
    ("rgba(248, 250, 252, 0.5)", "var(--hub-grid-line)"),

    # rgba - accent
    ("rgba(94, 234, 212, 0.75)", "var(--hub-accent-icon-soft)"),
    ("rgba(94, 234, 212, 0.72)", "var(--hub-accent-icon)"),
    ("rgba(20, 184, 166, 0.55)", "var(--hub-accent-focus)"),
    ("rgba(20, 184, 166, 0.45)", "var(--hub-accent-border-focus)"),
    ("rgba(20, 184, 166, 0.42)", "var(--hub-accent-border-active)"),
    ("rgba(20, 184, 166, 0.35)", "var(--hub-accent-border-hover)"),
    ("rgba(20, 184, 166, 0.32)", "var(--hub-accent-border-strong)"),
    ("rgba(20, 184, 166, 0.28)", "var(--hub-accent-border)"),
    ("rgba(20, 184, 166, 0.25)", "var(--hub-accent-fill-medium)"),
    ("rgba(20, 184, 166, 0.22)", "var(--hub-border-interactive)"),
    ("rgba(20, 184, 166, 0.2)", "var(--hub-accent-fill-medium)"),
    ("rgba(20, 184, 166, 0.18)", "var(--hub-accent-soft-medium)"),
    ("rgba(20, 184, 166, 0.15)", "var(--hub-accent-fill-soft)"),
    ("rgba(20, 184, 166, 0.14)", "var(--hub-accent-soft-strong)"),
    ("rgba(20, 184, 166, 0.12)", "var(--hub-accent-soft)"),
    ("rgba(20, 184, 166, 0.1)", "var(--hub-accent-glow)"),
    ("rgba(20, 184, 166, 0.08)", "var(--hub-accent-fill-soft)"),
    ("rgba(20, 184, 166, 0.055)", "var(--hub-accent-whisper)"),

    # rgba - surfaces
    ("rgba(15, 23, 42, 0.92)", "var(--hub-surface-solid)"),
    ("rgba(15, 23, 42, 0.85)", "var(--hub-surface-opaque)"),
    ("rgba(15, 23, 42, 0.72)", "var(--hub-surface-heavy)"),
    ("rgba(15, 23, 42, 0.65)", "var(--hub-surface-deep)"),
    ("rgba(15, 23, 42, 0.62)", "var(--hub-surface-deep)"),
    ("rgba(15, 23, 42, 0.55)", "var(--hub-surface-1)"),
    ("rgba(15, 23, 42, 0.52)", "var(--hub-surface-panel)"),
    ("rgba(15, 23, 42, 0.48)", "var(--hub-surface-3)"),
    ("rgba(15, 23, 42, 0.45)", "var(--hub-surface-input)"),
    ("rgba(15, 23, 42, 0.38)", "var(--hub-surface-2)"),
    ("rgba(15, 23, 42, 0.35)", "var(--hub-surface-2)"),
    ("rgba(15, 23, 42, 0.08)", "var(--hub-ink-faint)"),
    ("rgba(15, 23, 42, 0.07)", "var(--hub-ink-faint)"),
    ("rgba(15, 23, 42, 0.06)", "var(--hub-ink-faint)"),
    ("rgba(15, 23, 42, 0.04)", "var(--hub-ink-whisper)"),
    ("rgba(15, 23, 42, 0.03)", "var(--hub-ink-whisper)"),
    ("rgba(15, 23, 42, 0.22)", "var(--shadow-ink-sm)"),

    # rgba - hub bg scrims
    ("rgba(6, 8, 15, 0.78)", "var(--hub-bg-scrim-heavy)"),
    ("rgba(6, 8, 15, 0.72)", "var(--hub-bg-overlay)"),
    ("rgba(6, 8, 15, 0.52)", "var(--hub-bg-scrim)"),
    ("rgba(6, 8, 15, 0.45)", "var(--hub-bg-scrim-medium)"),
    ("rgba(6, 8, 15, 0.35)", "var(--hub-bg-scrim-fade)"),
    ("rgba(6, 8, 15, 0.28)", "var(--hub-bg-scrim-light)"),

    # rgba - white
    ("rgba(255, 255, 255, 0.97)", "var(--color-white-strong)"),
    ("rgba(255, 255, 255, 0.96)", "var(--color-white-strong)"),
    ("rgba(255, 255, 255, 0.95)", "var(--color-white-strong)"),
    ("rgba(255, 255, 255, 0.92)", "var(--color-white-emphasis)"),
    ("rgba(255, 255, 255, 0.9)", "var(--color-white-emphasis)"),
    ("rgba(255, 255, 255, 0.85)", "var(--color-white-medium)"),
    ("rgba(255, 255, 255, 0.75)", "var(--color-white-soft-strong)"),
    ("rgba(255, 255, 255, 0.5)", "var(--color-white-muted)"),
    ("rgba(255, 255, 255, 0.28)", "var(--color-white-border-strong)"),
    ("rgba(255, 255, 255, 0.22)", "var(--color-white-border-hover)"),
    ("rgba(255, 255, 255, 0.18)", "var(--color-white-border-emphasis)"),
    ("rgba(255, 255, 255, 0.16)", "var(--color-white-shine)"),
    ("rgba(255, 255, 255, 0.14)", "var(--color-white-shine-soft)"),
    ("rgba(255, 255, 255, 0.12)", "var(--color-white-border)"),
    ("rgba(255, 255, 255, 0.1)", "var(--color-white-soft)"),
    ("rgba(255, 255, 255, 0.08)", "var(--color-white-border)"),
    ("rgba(255, 255, 255, 0.06)", "var(--hub-inset-highlight-strong)"),
    ("rgba(255, 255, 255, 0.05)", "var(--hub-inset-highlight)"),
    ("rgba(255, 255, 255, 0.04)", "var(--hub-inset-soft)"),

    # rgba - danger / warning / highlight
    ("rgba(239, 68, 68, 0.35)", "var(--hub-danger-border)"),
    ("rgba(239, 68, 68, 0.12)", "var(--hub-danger-mark-bg)"),
    ("rgba(239, 68, 68, 0.1)", "var(--hub-danger-soft)"),
    ("rgba(245, 158, 11, 0.45)", "var(--color-highlight-border)"),
    ("rgba(245, 158, 11, 0.4)", "var(--color-highlight-glow)"),
    ("rgba(245, 158, 11, 0.35)", "var(--color-highlight-glow)"),
    ("rgba(245, 158, 11, 0.14)", "var(--color-highlight-soft)"),
    ("rgba(245, 158, 11, 0.12)", "var(--hub-warning-soft)"),
    ("rgba(249, 115, 22, 0.12)", "var(--color-streak-soft)"),

    # rgba - black shadows
    ("rgba(0, 0, 0, 0.45)", "var(--shadow-black-strong)"),
    ("rgba(0, 0, 0, 0.4)", "var(--shadow-black-md)"),
    ("rgba(0, 0, 0, 0.35)", "var(--shadow-black-base)"),
    ("rgba(0, 0, 0, 0.32)", "var(--shadow-black-soft)"),
    ("rgba(0, 0, 0, 0.3)", "var(--shadow-black-soft)"),
    ("rgba(0, 0, 0, 0.28)", "var(--shadow-black-xs)"),
    ("rgba(0, 0, 0, 0.25)", "var(--shadow-black-xs)"),
    ("rgba(0, 0, 0, 0.24)", "var(--shadow-black-xs)"),
    ("rgba(0, 0, 0, 0.22)", "var(--shadow-black-xxs)"),

    # rgba - slate / ink
    ("rgba(28, 25, 23, 0.15)", "var(--color-ink-border)"),
    ("rgba(28, 25, 23, 0.05)", "var(--shadow-ink-sm)"),
    ("rgba(28, 25, 23, 0.04)", "var(--shadow-ink-xs)"),
    ("rgba(28, 25, 23, 0.03)", "var(--shadow-ink-xxs)"),
    ("rgba(153, 246, 228, 0.45)", "var(--color-accent-border-strong)"),

    # hex colors
    ("#ffffff", "var(--color-white)"),
    ("#fffbeb", "var(--color-highlight-warm)"),
    ("#fff", "var(--color-white)"),
    ("#fbbf24", "var(--color-streak-gold)"),
    ("#fb923c", "var(--color-streak-orange)"),
    ("#fdba74", "var(--color-streak-peach)"),
    ("#f8fafc", "var(--hub-text-primary)"),
    ("#5eead4", "var(--hub-accent)"),
    ("#64748b", "var(--color-slate-muted)"),
    ("#334155", "var(--color-slate-soft)"),
    ("#2dd4bf", "var(--color-accent-bright)"),
    ("#1e293b", "var(--color-primary-hover)"),
    ("#0f172a", "var(--color-primary)"),
    ("#0d9488", "var(--color-accent-hover)"),
    ("#14b8a6", "var(--color-accent)"),
    ("#06080f", "var(--hub-bg)"),
    ("#b91c1c", "var(--color-danger-ink)"),

    # ── Pass 2: remaining feature CSS ──
    ("rgba(255, 255, 255, 0.98)", "var(--color-white-bright)"),
    ("rgba(255, 255, 255, 0.96)", "var(--color-accent-mint-strong)"),
    ("rgba(255, 255, 255, 0.92)", "var(--color-accent-mint)"),
    ("rgba(255, 255, 255, 0.88)", "var(--color-white-high)"),
    ("rgba(255, 255, 255, 0.8)", "var(--color-white-dim)"),
    ("rgba(255, 255, 255, 0.72)", "var(--shadow-white-muted)"),
    ("rgba(255, 255, 255, 0.7)", "var(--color-white-faint)"),
    ("rgba(255, 255, 255, 0.55)", "var(--color-white-subtle)"),
    ("rgba(255, 255, 255, 0.35)", "var(--shadow-white-dim)"),
    ("rgba(255, 255, 255, 0.3)", "var(--color-white-ghost)"),
    ("rgba(255, 255, 255, 0.2)", "var(--color-white-border-hover)"),
    ("rgba(255, 255, 255, 0)", "var(--shadow-white-fade)"),
    ("rgba(236, 253, 248, 0.96)", "var(--color-accent-mint-strong)"),
    ("rgba(236, 253, 248, 0.92)", "var(--color-accent-mint)"),
    ("rgba(254, 202, 202, 0.82)", "var(--color-danger-soft-strong)"),
    ("rgba(248, 250, 252, 0.76)", "var(--hub-text-luminous)"),
    ("rgba(248, 250, 252, 0.75)", "var(--hub-text-bright)"),
    ("rgba(248, 250, 252, 0.65)", "var(--hub-text-light)"),
    ("rgba(248, 250, 252, 0.46)", "var(--hub-text-faded)"),
    ("rgba(248, 250, 252, 0.4)", "var(--hub-text-quiet)"),
    ("rgba(248, 250, 252, 0.35)", "var(--hub-text-dimmer)"),
    ("rgba(248, 250, 252, 0.18)", "var(--hub-border-light)"),
    ("rgba(20, 184, 166, 0.4)", "var(--hub-accent-strong)"),
    ("rgba(20, 184, 166, 0.16)", "var(--hub-accent-muted)"),
    ("rgba(20, 184, 166, 0.06)", "var(--hub-accent-whisper-soft)"),
    ("rgba(45, 212, 191, 0.6)", "var(--hub-accent-bright-medium)"),
    ("rgba(45, 212, 191, 0.35)", "var(--hub-accent-bright-soft)"),
    ("rgba(6, 8, 15, 0.85)", "var(--hub-bg-solid)"),
    ("rgba(6, 8, 15, 0.62)", "var(--hub-bg-modal)"),
    ("rgba(6, 8, 15, 0.58)", "var(--hub-bg-modal-heavy)"),
    ("rgba(6, 8, 15, 0.2)", "var(--hub-bg-scrim-soft)"),
    ("rgba(6, 8, 15, 0.12)", "var(--hub-bg-scrim-faint)"),
    ("rgba(15, 23, 42, 0.58)", "var(--shadow-ghost-input)"),
    ("rgba(15, 23, 42, 0.42)", "var(--shadow-ghost-panel)"),
    ("rgba(15, 23, 42, 0.4)", "var(--shadow-ghost-medium)"),
    ("rgba(15, 23, 42, 0.3)", "var(--shadow-ghost-deep)"),
    ("rgba(15, 23, 42, 0.25)", "var(--shadow-ghost-heavy)"),
    ("rgba(15, 23, 42, 0.05)", "var(--shadow-ghost-light)"),
    ("rgba(0, 0, 0, 0.2)", "var(--shadow-inset-darker)"),
    ("rgba(0, 0, 0, 0.15)", "var(--shadow-inset-dark)"),
    ("rgba(245, 158, 11, 0.5)", "var(--color-highlight-intense)"),
    ("rgba(245, 158, 11, 0.34)", "var(--shadow-highlight-lg)"),
    ("rgba(245, 158, 11, 0.28)", "var(--color-highlight-soft-strong)"),
    ("rgba(245, 158, 11, 0.22)", "var(--color-highlight-soft-medium)"),
    ("rgba(245, 158, 11, 0.15)", "var(--color-highlight-faint)"),
    ("rgba(239, 68, 68, 0.14)", "var(--color-danger-soft-medium)"),
    ("#fca5a5", "var(--hub-danger-text)"),
    ("#fecaca", "var(--hub-danger-text-strong)"),
    ("#99f6e4", "var(--color-accent-border)"),
    ("#cbd5e1", "var(--color-slate-light)"),
    ("#991b1b", "var(--color-danger-text-dark)"),
    ("#0a0f1a", "var(--color-black-soft)"),
    ("#000", "var(--color-black)"),
]

REPLACEMENTS.sort(key=lambda item: len(item[0]), reverse=True)


def migrate_file(path: Path) -> int:
    rel = path.relative_to(ROOT.parent.parent).as_posix()
    if any(rel.endswith(skip) for skip in SKIP):
        return 0

    original = path.read_text()
    updated = original
    count = 0

    for old, new in REPLACEMENTS:
        if old in updated:
            occurrences = updated.count(old)
            updated = updated.replace(old, new)
            count += occurrences

    if updated != original:
        path.write_text(updated)

    return count


def main() -> None:
    total = 0
    files_changed = 0

    for path in sorted(ROOT.rglob("*.css")):
        changed = migrate_file(path)
        if changed:
            files_changed += 1
            total += changed
            print(f"{path.relative_to(ROOT)}: {changed} replacements")

    print(f"\nTotal: {total} replacements in {files_changed} files")


if __name__ == "__main__":
    main()
