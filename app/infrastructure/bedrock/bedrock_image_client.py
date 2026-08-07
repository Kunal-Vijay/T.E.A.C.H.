from __future__ import annotations

from pydantic import validate_call

from app.domain.interfaces import ILLMImageClient


class BedrockImageClient(ILLMImageClient):
    @validate_call(validate_return=False)
    def generate_image(self, generation_prompt: str) -> bytes | None:
        return None
