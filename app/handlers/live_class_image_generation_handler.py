from __future__ import annotations

import json
from uuid import UUID

from kink import di, inject

from app.core.database import get_db
from app.domain.enums import AssetStatus, GenerationStatus
from app.domain.interfaces import IUnitOfWork
from app.infrastructure.unit_of_work import UnitOfWork


def setup_di() -> None:
    database_session = next(get_db())
    di[IUnitOfWork] = UnitOfWork(database_session)


@inject
def handle(event: dict, _context, unit_of_work: IUnitOfWork = di[IUnitOfWork]) -> dict:
    setup_di()
    for record in event.get("Records", []):
        message_body = json.loads(record["body"])
        asset_id = UUID(message_body["asset_id"])
        generation_id = UUID(message_body["generation_id"])
        with unit_of_work:
            asset = unit_of_work.live_class_repository.find_asset_by_id(asset_id)
            if asset is None:
                continue
            asset.status = AssetStatus.COMPLETED
            unit_of_work.live_class_repository.update_asset(asset)
            total_assets, completed_assets = unit_of_work.live_class_repository.count_assets_by_generation(generation_id)
            if total_assets == completed_assets:
                generation = unit_of_work.live_class_repository.find_generation_by_id(generation_id)
                if generation is not None:
                    generation.status = GenerationStatus.COMPLETED
                    unit_of_work.live_class_repository.update_generation(generation)
    return {"statusCode": 200, "body": "processed"}
