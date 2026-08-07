from __future__ import annotations

import uuid

from pydantic import validate_call

from app.application.dtos.student.student_profile_dto import (
    StudentProfileResponseDTO,
    UpdateStudentProfileRequestDTO,
)
from app.domain.entities import StudentProfileEntity
from app.domain.interfaces import IUnitOfWork
from app.domain.student_params import default_student_params


class StudentProfileService:
    def __init__(self, unit_of_work: IUnitOfWork) -> None:
        self.unit_of_work = unit_of_work

    @validate_call(validate_return=True)
    def get_or_create_profile(self, student_identifier: str) -> StudentProfileResponseDTO:
        with self.unit_of_work:
            existing = self.unit_of_work.student_profile_repository.find_by_student_identifier(
                student_identifier
            )
            if existing is not None:
                return StudentProfileResponseDTO.from_entity(existing)
            created = self.unit_of_work.student_profile_repository.upsert(
                StudentProfileEntity(
                    id=uuid.uuid4(),
                    student_identifier=student_identifier,
                    display_name=None,
                    attributes=default_student_params(),
                )
            )
        return StudentProfileResponseDTO.from_entity(created)

    @validate_call(validate_return=True)
    def update_profile(
        self,
        student_identifier: str,
        request_dto: UpdateStudentProfileRequestDTO,
    ) -> StudentProfileResponseDTO:
        with self.unit_of_work:
            existing = self.unit_of_work.student_profile_repository.find_by_student_identifier(
                student_identifier
            )
            profile_id = existing.id if existing is not None else uuid.uuid4()
            updated = self.unit_of_work.student_profile_repository.upsert(
                StudentProfileEntity(
                    id=profile_id,
                    student_identifier=student_identifier,
                    display_name=request_dto.display_name,
                    attributes=request_dto.attributes.to_snapshot(),
                )
            )
        return StudentProfileResponseDTO.from_entity(updated)
