from __future__ import annotations

from uuid import UUID

from pydantic import validate_call

from app.config import settings
from app.domain.interfaces import IStorageClient


class S3StorageClient(IStorageClient):
    @validate_call(validate_return=True)
    def upload_image(self, asset_id: UUID, image_bytes: bytes, content_type: str) -> str:
        return f"https://{settings.S3_BUCKET}.s3.amazonaws.com/assets/{asset_id}.png"
