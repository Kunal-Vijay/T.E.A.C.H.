from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query

from app.application.background.generation_background import run_sync_content_generation
from app.application.dtos.generation.generation_status_response_dto import (
    GenerationStartedResponseDTO,
    GenerationStatusResponseDTO,
    PaginatedGenerationListDTO,
)
from app.application.services.live_class_generation_service import LiveClassGenerationService
from app.core.dependencies import get_live_class_generation_service
from app.domain.exceptions import ClassPlanNotFoundException, GenerationNotFoundException, ValidationException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Generation"])


@router.post("/class-plans/{plan_id}/generate", status_code=202, response_model=GenerationStartedResponseDTO)
def trigger_generation(
    plan_id: UUID,
    background_tasks: BackgroundTasks,
    service: LiveClassGenerationService = Depends(get_live_class_generation_service),
) -> GenerationStartedResponseDTO:
    try:
        logger.info("Generate endpoint called for plan_id=%s", plan_id)
        response = service.trigger_generation(plan_id)
        if service.should_run_sync_generation():
            logger.info(
                "Scheduling background generation generation_id=%s plan_id=%s",
                response.generation_id,
                plan_id,
            )
            background_tasks.add_task(run_sync_content_generation, response.generation_id, plan_id)
        return response
    except ClassPlanNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/generations/{generation_id}", response_model=GenerationStatusResponseDTO)
def get_generation_status(
    generation_id: UUID,
    service: LiveClassGenerationService = Depends(get_live_class_generation_service),
) -> GenerationStatusResponseDTO:
    try:
        return service.get_generation_status(generation_id)
    except GenerationNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/class-plans/{plan_id}/generations", response_model=PaginatedGenerationListDTO)
def list_generations(
    plan_id: UUID,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    service: LiveClassGenerationService = Depends(get_live_class_generation_service),
) -> PaginatedGenerationListDTO:
    return service.list_generations_by_plan(plan_id, page, limit)
