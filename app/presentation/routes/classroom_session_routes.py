from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.application.dtos.classroom.classroom_session_dto import (
    ClassroomSessionResponseDTO,
    CreateClassroomSessionRequestDTO,
    StudentInputRequestDTO,
)
from app.application.dtos.workflow.current_state_response_dto import CurrentStateResponseDTO, TopicWorkflowResponseDTO
from app.application.services.classroom_session_service import ClassroomSessionService
from app.application.services.workflow_navigation_service import WorkflowNavigationService
from app.core.dependencies import get_classroom_session_service, get_workflow_navigation_service
from app.domain.exceptions import (
    ClassroomSessionNotFoundException,
    GenerationNotFoundException,
    InvalidWorkflowStateException,
    ValidationException,
)

router = APIRouter(prefix="/api/v1/classroom-sessions", tags=["Classroom Sessions"])


@router.post("", status_code=201, response_model=ClassroomSessionResponseDTO)
def create_classroom_session(
    request_dto: CreateClassroomSessionRequestDTO,
    service: ClassroomSessionService = Depends(get_classroom_session_service),
) -> ClassroomSessionResponseDTO:
    try:
        return service.create_session(request_dto)
    except ValidationException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except GenerationNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{session_id}", response_model=ClassroomSessionResponseDTO)
def get_classroom_session(
    session_id: UUID,
    service: ClassroomSessionService = Depends(get_classroom_session_service),
) -> ClassroomSessionResponseDTO:
    try:
        return service.get_session(session_id)
    except ClassroomSessionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{session_id}/current", response_model=CurrentStateResponseDTO)
def get_current_state(
    session_id: UUID,
    service: ClassroomSessionService = Depends(get_classroom_session_service),
) -> CurrentStateResponseDTO:
    try:
        return service.get_current_state(session_id)
    except ClassroomSessionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/{session_id}/advance", response_model=CurrentStateResponseDTO)
def advance_session(
    session_id: UUID,
    service: ClassroomSessionService = Depends(get_classroom_session_service),
) -> CurrentStateResponseDTO:
    try:
        return service.advance_session(session_id)
    except ClassroomSessionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InvalidWorkflowStateException as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/{session_id}/student-input", response_model=CurrentStateResponseDTO)
def submit_student_input(
    session_id: UUID,
    request_dto: StudentInputRequestDTO,
    service: ClassroomSessionService = Depends(get_classroom_session_service),
) -> CurrentStateResponseDTO:
    try:
        return service.submit_student_input(session_id, request_dto)
    except ClassroomSessionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except (InvalidWorkflowStateException, ValidationException) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/{session_id}/skip-doubts", response_model=CurrentStateResponseDTO)
def skip_doubts(
    session_id: UUID,
    service: ClassroomSessionService = Depends(get_classroom_session_service),
) -> CurrentStateResponseDTO:
    try:
        return service.skip_doubts(session_id)
    except ClassroomSessionNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


workflow_router = APIRouter(prefix="/api/v1/generations", tags=["Workflow"])


@workflow_router.get("/{generation_id}/topics/{topic_id}/workflow", response_model=TopicWorkflowResponseDTO)
def get_topic_workflow(
    generation_id: UUID,
    topic_id: UUID,
    service: WorkflowNavigationService = Depends(get_workflow_navigation_service),
) -> TopicWorkflowResponseDTO:
    try:
        return service.get_topic_workflow(generation_id, topic_id)
    except GenerationNotFoundException as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
