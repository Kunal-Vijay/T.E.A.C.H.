from __future__ import annotations

import logging
import time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.application.dtos.class_plan.class_plan_response_dto import (
    ClassPlanDetailResponseDTO,
    ClassPlanResponseDTO,
    PaginatedClassPlanListDTO,
)
from app.application.dtos.class_plan.create_class_plan_request_dto import (
    CreateClassPlanRequestDTO,
    UpdateClassPlanRequestDTO,
)
from app.application.services.class_plan_service import ClassPlanService
from app.core.dependencies import get_class_plan_service
from app.domain.enums import PlanStatus
from app.domain.exceptions import ClassPlanNotFoundException, DomainException, ValidationException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/class-plans", tags=["Class Plans"])


@router.post("", status_code=201, response_model=ClassPlanResponseDTO)
def create_class_plan(
    request_dto: CreateClassPlanRequestDTO,
    service: ClassPlanService = Depends(get_class_plan_service),
) -> ClassPlanResponseDTO:
    try:
        return service.create_class_plan(request_dto)
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("", response_model=PaginatedClassPlanListDTO)
def list_class_plans(
    subject: str | None = Query(default=None),
    grade: str | None = Query(default=None),
    target_exam: str | None = Query(default=None),
    status: PlanStatus | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    service: ClassPlanService = Depends(get_class_plan_service),
) -> PaginatedClassPlanListDTO:
    return service.list_class_plans(subject, grade, target_exam, status, page, limit)


@router.get("/{plan_id}", response_model=ClassPlanDetailResponseDTO)
def get_class_plan(
    plan_id: UUID,
    service: ClassPlanService = Depends(get_class_plan_service),
) -> ClassPlanDetailResponseDTO:
    try:
        return service.get_class_plan(plan_id)
    except ClassPlanNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.put("/{plan_id}", response_model=ClassPlanResponseDTO)
def update_class_plan(
    plan_id: UUID,
    request_dto: UpdateClassPlanRequestDTO,
    service: ClassPlanService = Depends(get_class_plan_service),
) -> ClassPlanResponseDTO:
    try:
        return service.update_class_plan(plan_id, request_dto)
    except ClassPlanNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/{plan_id}", status_code=204, response_class=Response)
def delete_class_plan(
    plan_id: UUID,
    service: ClassPlanService = Depends(get_class_plan_service),
) -> Response:
    try:
        service.delete_class_plan(plan_id)
        return Response(status_code=204)
    except ClassPlanNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/{plan_id}/publish", response_model=ClassPlanResponseDTO)
def publish_class_plan(
    plan_id: UUID,
    service: ClassPlanService = Depends(get_class_plan_service),
) -> ClassPlanResponseDTO:
    try:
        return service.publish_class_plan(plan_id)
    except ClassPlanNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/{plan_id}/unpublish", response_model=ClassPlanResponseDTO)
def unpublish_class_plan(
    plan_id: UUID,
    service: ClassPlanService = Depends(get_class_plan_service),
) -> ClassPlanResponseDTO:
    try:
        return service.unpublish_class_plan(plan_id)
    except ClassPlanNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
