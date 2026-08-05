from __future__ import annotations

import logging
from uuid import UUID

from pydantic import validate_call

from app.config import settings
from app.domain.interfaces import IQueueClient

logger = logging.getLogger(__name__)


class SQSQueueClient(IQueueClient):
    @validate_call(validate_return=False)
    def send_content_generation_message(self, generation_id: UUID, class_plan_id: UUID) -> None:
        if settings.LIVE_CLASS_CONTENT_GENERATION_QUEUE_URL == "":
            logger.info("Sync generation mode — skipping SQS enqueue for generation %s", generation_id)
            return None
        import boto3

        sqs_client = boto3.client("sqs", region_name=settings.REGION)
        sqs_client.send_message(
            QueueUrl=settings.LIVE_CLASS_CONTENT_GENERATION_QUEUE_URL,
            MessageBody=f'{{"generation_id": "{generation_id}", "class_plan_id": "{class_plan_id}"}}',
        )
        return None

    @validate_call(validate_return=False)
    def send_image_generation_message(self, asset_id: UUID, generation_id: UUID) -> None:
        if settings.LIVE_CLASS_IMAGE_GENERATION_QUEUE_URL == "":
            logger.info("Sync generation mode — skipping image queue for asset %s", asset_id)
            return None
        import boto3

        sqs_client = boto3.client("sqs", region_name=settings.REGION)
        sqs_client.send_message(
            QueueUrl=settings.LIVE_CLASS_IMAGE_GENERATION_QUEUE_URL,
            MessageBody=f'{{"asset_id": "{asset_id}", "generation_id": "{generation_id}"}}',
        )
        return None
