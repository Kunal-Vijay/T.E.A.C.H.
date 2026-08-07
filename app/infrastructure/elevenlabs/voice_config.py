"""Central ElevenLabs voice configuration.

All persona → voice ID mappings live here. To add a new persona, add one entry
to PERSONAS. Nothing else in the codebase needs to change.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Persona:
    id: str
    display_name: str
    voice_id: str
    style: str


# ─── Voice personas ───
# Add new personas here. The frontend sends the persona `id` string.
PERSONAS: dict[str, Persona] = {
    "female": Persona(
        id="female",
        display_name="Nova",
        voice_id="EXAVITQu4vr4xnSDxMaL",  # ElevenLabs "Bella" — warm, encouraging
        style="Warm, encouraging, patient",
    ),
    "male": Persona(
        id="male",
        display_name="Albert",
        voice_id="RDWdsTU6N02BFftbIEAp",  # Calm, confident, mentor-like
        style="Calm, confident, mentor-like",
    ),
}

DEFAULT_PERSONA_ID = "male"


def resolve_voice_id(persona_id: str | None) -> str:
    """Map a persona ID to its ElevenLabs voice ID.

    Falls back to the default persona if the ID is missing or unrecognised.
    """
    if persona_id is None or persona_id.strip() == "":
        persona_id = DEFAULT_PERSONA_ID
    persona = PERSONAS.get(persona_id.strip().lower())
    if persona is None:
        persona = PERSONAS[DEFAULT_PERSONA_ID]
    return persona.voice_id


def list_personas() -> list[dict[str, str]]:
    """Return the available personas for the frontend to display."""
    return [
        {"id": p.id, "display_name": p.display_name, "style": p.style}
        for p in PERSONAS.values()
    ]
