"""Google Cloud TTS voice configuration.

All persona → voice mappings live here. To add a new persona, add one entry
to VOICE_CONFIG. Nothing else in the codebase needs to change.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class VoiceSpec:
    """One configured voice for Google Cloud TTS."""

    name: str
    language_code: str
    gender: str  # "MALE" | "FEMALE" | "NEUTRAL"


VOICE_CONFIG: dict[str, VoiceSpec] = {
    "female": VoiceSpec(
        name="en-IN-Chirp3-HD-Achernar",
        language_code="en-IN",
        gender="FEMALE",
    ),
    "male": VoiceSpec(
        name="en-IN-Chirp3-HD-Aoede",
        language_code="en-IN",
        gender="MALE",
    ),
}

DEFAULT_PERSONA = "male"


def resolve_voice(persona: str | None) -> VoiceSpec:
    """Map a persona ID to its Google Cloud voice spec.

    Falls back to the default persona if the ID is missing or unrecognised.
    """
    if persona is None or persona.strip() == "":
        persona = DEFAULT_PERSONA
    voice = VOICE_CONFIG.get(persona.strip().lower())
    if voice is None:
        voice = VOICE_CONFIG[DEFAULT_PERSONA]
    return voice


def list_personas() -> list[dict[str, str]]:
    """Return the available personas for the frontend to display."""
    return [
        {"id": persona_id, "display_name": spec.name, "gender": spec.gender}
        for persona_id, spec in VOICE_CONFIG.items()
    ]
