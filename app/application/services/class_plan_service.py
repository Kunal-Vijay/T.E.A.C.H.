from __future__ import annotations

import uuid
from math import ceil

from pydantic import validate_call

from app.application.dtos.class_plan.class_plan_response_dto import (
    ClassPlanDetailResponseDTO,
    ClassPlanResponseDTO,
    LatestGenerationSummaryDTO,
    PaginatedClassPlanListDTO,
)
from app.application.dtos.class_plan.create_class_plan_request_dto import (
    CreateClassPlanRequestDTO,
    UpdateClassPlanRequestDTO,
)
from app.domain.entities import ClassPlanEntity, ClassPlanTopicEntity
from app.domain.enums import GenerationStatus, PlanStatus
from app.domain.exceptions import ClassPlanNotFoundException, ValidationException
from app.domain.interfaces import IUnitOfWork


class ClassPlanService:
    def __init__(self, unit_of_work: IUnitOfWork) -> None:
        self.unit_of_work = unit_of_work

    @validate_call(validate_return=True)
    def create_class_plan(self, request_dto: CreateClassPlanRequestDTO) -> ClassPlanResponseDTO:
        total_duration_minutes = sum(topic.duration_minutes for topic in request_dto.topics)
        plan_id = uuid.uuid4()
        topic_entities = [
            ClassPlanTopicEntity(
                id=uuid.uuid4(),
                class_plan_id=plan_id,
                order=topic.order,
                title=topic.title,
                duration_minutes=topic.duration_minutes,
                base_material=topic.base_material,
                teaching_notes=topic.teaching_notes,
                miscellaneous_notes=topic.miscellaneous_notes,
            )
            for topic in request_dto.topics
        ]
        class_plan_entity = ClassPlanEntity(
            id=plan_id,
            title=request_dto.title,
            subject=request_dto.subject,
            grade=request_dto.grade,
            class_label=request_dto.class_label,
            chapter_name=request_dto.chapter_name,
            chapter_number=request_dto.chapter_number,
            target_exam=request_dto.target_exam,
            language_code=request_dto.language_code,
            total_duration_minutes=total_duration_minutes,
            status=PlanStatus.DRAFT,
            created_by=request_dto.created_by,
            topics=topic_entities,
        )
        with self.unit_of_work:
            created_plan = self.unit_of_work.class_plan_repository.create(class_plan_entity)
        return ClassPlanResponseDTO.from_entity(created_plan)

    @validate_call(validate_return=True)
    def update_class_plan(self, plan_id: uuid.UUID, request_dto: UpdateClassPlanRequestDTO) -> ClassPlanResponseDTO:
        with self.unit_of_work:
            existing_plan = self.unit_of_work.class_plan_repository.find_by_id(plan_id)
            if existing_plan is None:
                raise ClassPlanNotFoundException(f"Class plan {plan_id} not found")
            if existing_plan.status != PlanStatus.DRAFT:
                raise ValidationException("Only draft class plans can be updated")
            total_duration_minutes = sum(topic.duration_minutes for topic in request_dto.topics)
            updated_plan = ClassPlanEntity(
                id=existing_plan.id,
                title=request_dto.title,
                subject=request_dto.subject,
                grade=request_dto.grade,
                class_label=request_dto.class_label,
                chapter_name=request_dto.chapter_name,
                chapter_number=request_dto.chapter_number,
                target_exam=request_dto.target_exam,
                language_code=request_dto.language_code,
                total_duration_minutes=total_duration_minutes,
                status=existing_plan.status,
                created_by=existing_plan.created_by,
                topics=[
                    ClassPlanTopicEntity(
                        id=uuid.uuid4(),
                        class_plan_id=existing_plan.id,
                        order=topic.order,
                        title=topic.title,
                        duration_minutes=topic.duration_minutes,
                        base_material=topic.base_material,
                        teaching_notes=topic.teaching_notes,
                        miscellaneous_notes=topic.miscellaneous_notes,
                    )
                    for topic in request_dto.topics
                ],
            )
            saved_plan = self.unit_of_work.class_plan_repository.update(updated_plan)
        return ClassPlanResponseDTO.from_entity(saved_plan)

    @validate_call(validate_return=True)
    def get_class_plan(self, plan_id: uuid.UUID) -> ClassPlanDetailResponseDTO:
        with self.unit_of_work:
            class_plan = self.unit_of_work.class_plan_repository.find_by_id(plan_id)
            if class_plan is None:
                raise ClassPlanNotFoundException(f"Class plan {plan_id} not found")
            latest_generation = self.unit_of_work.live_class_repository.find_latest_generation_by_plan_id(plan_id)
        latest_generation_summary = None
        if latest_generation is not None:
            latest_generation_summary = LatestGenerationSummaryDTO(
                generation_id=latest_generation.id,
                status=latest_generation.status.value,
            )
        return ClassPlanDetailResponseDTO.from_entity(class_plan, latest_generation_summary)

    @validate_call(validate_return=True)
    def list_class_plans(
        self,
        subject: str | None,
        grade: str | None,
        target_exam: str | None,
        status: PlanStatus | None,
        page: int,
        limit: int,
    ) -> PaginatedClassPlanListDTO:
        offset = (page - 1) * limit
        with self.unit_of_work:
            class_plans, total_count = self.unit_of_work.class_plan_repository.find_all(
                subject, grade, target_exam, status, offset, limit
            )
        return PaginatedClassPlanListDTO(
            items=[ClassPlanResponseDTO.from_entity(class_plan) for class_plan in class_plans],
            total=total_count,
            page=page,
            limit=limit,
        )

    @validate_call(validate_return=False)
    def delete_class_plan(self, plan_id: uuid.UUID) -> None:
        with self.unit_of_work:
            class_plan = self.unit_of_work.class_plan_repository.find_by_id(plan_id)
            if class_plan is None:
                raise ClassPlanNotFoundException(f"Class plan {plan_id} not found")
            if class_plan.status != PlanStatus.DRAFT:
                raise ValidationException("Only draft class plans can be deleted")
            latest_generation = self.unit_of_work.live_class_repository.find_latest_generation_by_plan_id(plan_id)
            if latest_generation is not None and latest_generation.status in {
                GenerationStatus.PENDING,
                GenerationStatus.GENERATING_CONTENT,
                GenerationStatus.GENERATING_IMAGES,
            }:
                raise ValidationException("Cannot delete plan while generation is in progress")
            self.unit_of_work.class_plan_repository.soft_delete(plan_id)
        return None

    @validate_call(validate_return=True)
    def publish_class_plan(self, plan_id: uuid.UUID) -> ClassPlanResponseDTO:
        with self.unit_of_work:
            class_plan = self.unit_of_work.class_plan_repository.find_by_id(plan_id)
            if class_plan is None:
                raise ClassPlanNotFoundException(f"Class plan {plan_id} not found")
            if class_plan.status != PlanStatus.DRAFT:
                raise ValidationException("Only draft class plans can be published")
            saved_plan = self.unit_of_work.class_plan_repository.update_status(plan_id, PlanStatus.PUBLISHED)
        return ClassPlanResponseDTO.from_entity(saved_plan)
