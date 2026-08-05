from __future__ import annotations

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session, joinedload

from app.domain.entities import ClassPlanEntity
from app.domain.enums import PlanStatus
from app.domain.interfaces import IClassPlanRepository
from app.infrastructure.decorators import log_repo_call
from app.infrastructure.models.live_class_models import ClassPlanModel, ClassPlanTopicModel


class ClassPlanRepository(IClassPlanRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    @log_repo_call
    @validate_call(validate_return=True)
    def create(self, class_plan: ClassPlanEntity) -> ClassPlanEntity:
        model = ClassPlanModel.from_entity(class_plan)
        self.session.add(model)
        self.session.flush()
        return self.find_by_id(model.id)

    @log_repo_call
    @validate_call(validate_return=True)
    def update(self, class_plan: ClassPlanEntity) -> ClassPlanEntity:
        existing_model = (
            self.session.query(ClassPlanModel)
            .options(joinedload(ClassPlanModel.topics.and_(ClassPlanTopicModel.is_active.is_(True))))
            .filter(ClassPlanModel.id == class_plan.id, ClassPlanModel.is_active.is_(True))
            .first()
        )
        if existing_model is None:
            return class_plan
        existing_model.title = class_plan.title
        existing_model.subject = class_plan.subject
        existing_model.grade = class_plan.grade
        existing_model.class_label = class_plan.class_label
        existing_model.chapter_name = class_plan.chapter_name
        existing_model.chapter_number = class_plan.chapter_number
        existing_model.target_exam = class_plan.target_exam
        existing_model.language_code = class_plan.language_code
        existing_model.total_duration_minutes = class_plan.total_duration_minutes
        existing_model.status = class_plan.status
        existing_model.created_by = class_plan.created_by
        for topic_model in existing_model.topics:
            topic_model.is_active = False
        for topic_entity in class_plan.topics:
            self.session.add(ClassPlanTopicModel.from_entity(topic_entity, class_plan.id))
        self.session.flush()
        return self.find_by_id(class_plan.id)

    @log_repo_call
    @validate_call(validate_return=True)
    def find_by_id(self, plan_id: UUID) -> ClassPlanEntity | None:
        model = (
            self.session.query(ClassPlanModel)
            .options(joinedload(ClassPlanModel.topics.and_(ClassPlanTopicModel.is_active.is_(True))))
            .filter(ClassPlanModel.id == plan_id, ClassPlanModel.is_active.is_(True))
            .first()
        )
        return model.to_entity() if model is not None else None

    @log_repo_call
    @validate_call(validate_return=True)
    def find_all(
        self,
        subject: str | None,
        grade: str | None,
        target_exam: str | None,
        status: PlanStatus | None,
        offset: int,
        limit: int,
    ) -> tuple[list[ClassPlanEntity], int]:
        query = (
            self.session.query(ClassPlanModel)
            .options(joinedload(ClassPlanModel.topics.and_(ClassPlanTopicModel.is_active.is_(True))))
            .filter(ClassPlanModel.is_active.is_(True))
        )
        if subject is not None:
            query = query.filter(ClassPlanModel.subject == subject)
        if grade is not None:
            query = query.filter(ClassPlanModel.grade == grade)
        if target_exam is not None:
            query = query.filter(ClassPlanModel.target_exam == target_exam)
        if status is not None:
            query = query.filter(ClassPlanModel.status == status)
        total_count = query.count()
        models = query.order_by(ClassPlanModel.created_at.desc()).offset(offset).limit(limit).all()
        return [model.to_entity() for model in models], total_count

    @log_repo_call
    @validate_call(validate_return=True)
    def update_status(self, plan_id: UUID, status: PlanStatus) -> ClassPlanEntity:
        model = (
            self.session.query(ClassPlanModel)
            .options(joinedload(ClassPlanModel.topics.and_(ClassPlanTopicModel.is_active.is_(True))))
            .filter(ClassPlanModel.id == plan_id, ClassPlanModel.is_active.is_(True))
            .first()
        )
        if model is None:
            raise ValueError(f"Class plan {plan_id} not found")
        model.status = status
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=False)
    def soft_delete(self, plan_id: UUID) -> None:
        model = (
            self.session.query(ClassPlanModel)
            .filter(ClassPlanModel.id == plan_id, ClassPlanModel.is_active.is_(True))
            .first()
        )
        if model is not None:
            model.is_active = False
            self.session.flush()
