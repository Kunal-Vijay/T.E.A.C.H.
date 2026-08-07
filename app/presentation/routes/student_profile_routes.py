from __future__ import annotations

from fastapi import APIRouter, Depends

from app.application.dtos.student.student_profile_dto import (
    StudentProfileResponseDTO,
    UpdateStudentProfileRequestDTO,
)
from app.application.services.student_profile_service import StudentProfileService
from app.core.dependencies import get_student_profile_service

router = APIRouter(prefix="/api/v1/students", tags=["Students"])


@router.get("/{student_identifier}/attributes", response_model=StudentProfileResponseDTO)
def get_student_attributes(
    student_identifier: str,
    service: StudentProfileService = Depends(get_student_profile_service),
) -> StudentProfileResponseDTO:
    return service.get_or_create_profile(student_identifier)


@router.put("/{student_identifier}/attributes", response_model=StudentProfileResponseDTO)
def update_student_attributes(
    student_identifier: str,
    request_dto: UpdateStudentProfileRequestDTO,
    service: StudentProfileService = Depends(get_student_profile_service),
) -> StudentProfileResponseDTO:
    return service.update_profile(student_identifier, request_dto)
