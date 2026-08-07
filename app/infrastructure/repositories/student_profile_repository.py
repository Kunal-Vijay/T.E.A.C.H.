from __future__ import annotations

from pydantic import validate_call
from sqlalchemy.orm import Session

from app.domain.entities import StudentProfileEntity
from app.domain.interfaces import IStudentProfileRepository
from app.infrastructure.decorators import log_repo_call
from app.infrastructure.models.learning_session_models import StudentProfileModel


class StudentProfileRepository(IStudentProfileRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    @log_repo_call
    @validate_call(validate_return=True)
    def upsert(self, profile: StudentProfileEntity) -> StudentProfileEntity:
        existing_model = (
            self.session.query(StudentProfileModel)
            .filter(
                StudentProfileModel.student_identifier == profile.student_identifier,
                StudentProfileModel.is_active.is_(True),
            )
            .first()
        )
        if existing_model is None:
            model = StudentProfileModel.from_entity(profile)
            self.session.add(model)
            self.session.flush()
            found = self.find_by_student_identifier(profile.student_identifier)
            if found is None:
                raise RuntimeError("Failed to load created student profile")
            return found
        existing_model.display_name = profile.display_name
        existing_model.attributes = profile.attributes.model_dump(mode="json")
        self.session.flush()
        found = self.find_by_student_identifier(profile.student_identifier)
        if found is None:
            raise RuntimeError("Failed to load updated student profile")
        return found

    @log_repo_call
    @validate_call(validate_return=True)
    def find_by_student_identifier(self, student_identifier: str) -> StudentProfileEntity | None:
        model = (
            self.session.query(StudentProfileModel)
            .filter(
                StudentProfileModel.student_identifier == student_identifier,
                StudentProfileModel.is_active.is_(True),
            )
            .first()
        )
        if model is None:
            return None
        return model.to_entity()
