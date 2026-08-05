from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class ContentGenerationQueueMessageDTO(BaseModel):
    generation_id: UUID
    class_plan_id: UUID


class ImageGenerationQueueMessageDTO(BaseModel):
    asset_id: UUID
    generation_id: UUID
