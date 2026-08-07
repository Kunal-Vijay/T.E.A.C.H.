from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from math import ceil
from uuid import UUID

from pydantic import validate_call

from app.application.dtos.generation.generation_status_response_dto import (
    GenerationStartedResponseDTO,
    GenerationStatusResponseDTO,
    PaginatedGenerationListDTO,
)
from app.config import settings
from app.domain.entities import (
    GeneratedAssetEntity,
    LiveClassGenerationEntity,
    LiveClassSlideEntity,
    SlideElementEntity,
    SlideExplanationEntity,
    TopicWorkflowEntity,
)
from app.domain.enums import AssetStatus, GenerationStatus, PlanStatus, TeachingApproach
from app.domain.exceptions import ClassPlanNotFoundException, GenerationNotFoundException, ValidationException
from app.domain.interfaces import ILLMWorkflowClient, IQueueClient, IUnitOfWork

logger = logging.getLogger(__name__)


class LiveClassGenerationService:
    def __init__(
        self,
        unit_of_work: IUnitOfWork,
        queue_client: IQueueClient,
        llm_workflow_client: ILLMWorkflowClient,
    ) -> None:
        self.unit_of_work = unit_of_work
        self.queue_client = queue_client
        self.llm_workflow_client = llm_workflow_client

    @validate_call(validate_return=True)
    def trigger_generation(self, plan_id: UUID) -> GenerationStartedResponseDTO:
        self._require_llm_configuration()
        logger.info("Generation trigger requested for plan_id=%s", plan_id)
        with self.unit_of_work:
            class_plan = self.unit_of_work.class_plan_repository.find_by_id(plan_id)
            if class_plan is None:
                raise ClassPlanNotFoundException(f"Class plan {plan_id} not found")
            if class_plan.status != PlanStatus.PUBLISHED:
                raise ValidationException("Only published class plans can be generated")
            latest_generation = self.unit_of_work.live_class_repository.find_latest_generation_by_plan_id(plan_id)
            if latest_generation is not None and latest_generation.status in {
                GenerationStatus.PENDING,
                GenerationStatus.GENERATING_CONTENT,
                GenerationStatus.GENERATING_IMAGES,
            }:
                logger.warning(
                    "Generation already in progress for plan_id=%s generation_id=%s status=%s",
                    plan_id,
                    latest_generation.id,
                    latest_generation.status.value,
                )
                raise ValidationException("Class generation is already in progress")
            generation_entity = LiveClassGenerationEntity(
                id=uuid.uuid4(),
                class_plan_id=plan_id,
                status=GenerationStatus.PENDING,
                llm_model=settings.BEDROCK_MODEL_ID,
            )
            created_generation = self.unit_of_work.live_class_repository.create_generation(generation_entity)
        self.queue_client.send_content_generation_message(created_generation.id, plan_id)
        logger.info(
            "Generation queued for plan_id=%s generation_id=%s model=%s",
            plan_id,
            created_generation.id,
            settings.BEDROCK_MODEL_ID,
        )
        return GenerationStartedResponseDTO(
            generation_id=created_generation.id,
            status=GenerationStatus.PENDING,
        )

    @validate_call(validate_return=True)
    def should_run_sync_generation(self) -> bool:
        return settings.SYNC_GENERATION and settings.LIVE_CLASS_CONTENT_GENERATION_QUEUE_URL == ""

    @validate_call(validate_return=True)
    def get_generation_status(self, generation_id: UUID) -> GenerationStatusResponseDTO:
        with self.unit_of_work:
            generation = self.unit_of_work.live_class_repository.find_generation_by_id(generation_id)
            if generation is None:
                raise GenerationNotFoundException(f"Generation {generation_id} not found")
            slides_generated = self.unit_of_work.live_class_repository.count_slides_by_generation(generation_id)
            images_total, images_completed = self.unit_of_work.live_class_repository.count_assets_by_generation(
                generation_id
            )
        return GenerationStatusResponseDTO.from_entity(
            generation, slides_generated, images_total, images_completed
        )

    @validate_call(validate_return=True)
    def list_generations_by_plan(self, plan_id: UUID, page: int, limit: int) -> PaginatedGenerationListDTO:
        offset = (page - 1) * limit
        with self.unit_of_work:
            generations, total_count = self.unit_of_work.live_class_repository.find_generations_by_plan_id(
                plan_id, offset, limit
            )
            items = [
                GenerationStatusResponseDTO.from_entity(
                    generation,
                    self.unit_of_work.live_class_repository.count_slides_by_generation(generation.id),
                    *self.unit_of_work.live_class_repository.count_assets_by_generation(generation.id),
                )
                for generation in generations
            ]
        return PaginatedGenerationListDTO(items=items, total=total_count, page=page, limit=limit)

    @validate_call(validate_return=False)
    def process_content_generation(self, generation_id: UUID, class_plan_id: UUID) -> None:
        self._require_llm_configuration()
        logger.info(
            "Starting content generation generation_id=%s plan_id=%s",
            generation_id,
            class_plan_id,
        )
        with self.unit_of_work:
            class_plan = self.unit_of_work.class_plan_repository.find_by_id(class_plan_id)
            generation = self.unit_of_work.live_class_repository.find_generation_by_id(generation_id)
            if class_plan is None or generation is None:
                logger.error(
                    "Generation skipped because plan or generation record was not found generation_id=%s plan_id=%s",
                    generation_id,
                    class_plan_id,
                )
                return None
            generation.status = GenerationStatus.GENERATING_CONTENT
            generation.started_at = datetime.now(UTC)
            self.unit_of_work.live_class_repository.update_generation(generation)

        try:
            asset_entities: list[GeneratedAssetEntity] = []
            for topic in sorted(class_plan.topics, key=lambda topic_item: topic_item.order):
                logger.info(
                    "Generating topic workflow generation_id=%s topic_order=%s topic_title=%s",
                    generation_id,
                    topic.order,
                    topic.title,
                )
                generated_topic = self.llm_workflow_client.generate_topic_workflow(class_plan, topic)
                workflow_entity = TopicWorkflowEntity(
                    id=uuid.uuid4(),
                    generation_id=generation_id,
                    topic_id=topic.id,
                    teaching_approach=TeachingApproach(generated_topic["teaching_approach"]),
                    approach_rationale=generated_topic["approach_rationale"],
                    workflow_definition=generated_topic["workflow"],
                )
                with self.unit_of_work:
                    self.unit_of_work.live_class_repository.save_topic_workflow(workflow_entity)
                    slide_entities: list[LiveClassSlideEntity] = []
                    explanation_entities: list[SlideExplanationEntity] = []
                    for slide_index, slide_payload in enumerate(generated_topic["slides"], start=1):
                        slide_uuid = UUID(slide_payload["slide_id"])
                        elements = [SlideElementEntity.model_validate(element) for element in slide_payload["elements"]]
                        slide_entity = LiveClassSlideEntity(
                            id=slide_uuid,
                            generation_id=generation_id,
                            topic_id=topic.id,
                            workflow_state_id=slide_payload["workflow_state_id"],
                            order=slide_index,
                            layout=slide_payload["layout"],
                            duration_seconds=slide_payload["duration_seconds"],
                            elements=elements,
                        )
                        slide_entities.append(slide_entity)
                        explanation_payload = slide_payload["explanation"]
                        explanation_entities.append(
                            SlideExplanationEntity(
                                id=uuid.uuid4(),
                                generation_id=generation_id,
                                slide_id=slide_uuid,
                                order=slide_index,
                                duration_seconds=explanation_payload["duration_seconds"],
                                explanation_text=explanation_payload["explanation_text"],
                            )
                        )
                        for element in elements:
                            if element.type == "image" and element.generation_prompt is not None:
                                asset_entities.append(
                                    GeneratedAssetEntity(
                                        id=uuid.uuid4(),
                                        generation_id=generation_id,
                                        slide_id=slide_uuid,
                                        element_id=element.element_id,
                                        generation_prompt=element.generation_prompt,
                                        status=AssetStatus.PENDING,
                                    )
                                )
                    self.unit_of_work.live_class_repository.save_slides(slide_entities)
                    self.unit_of_work.live_class_repository.save_explanations(explanation_entities)

            with self.unit_of_work:
                generation = self.unit_of_work.live_class_repository.find_generation_by_id(generation_id)
                if generation is None:
                    return None
                if len(asset_entities) == 0:
                    generation.status = GenerationStatus.COMPLETED
                    generation.completed_at = datetime.now(UTC)
                else:
                    generation.status = GenerationStatus.GENERATING_IMAGES
                    self.unit_of_work.live_class_repository.save_assets(asset_entities)
                    for asset_entity in asset_entities:
                        asset_entity.status = AssetStatus.COMPLETED
                        self.unit_of_work.live_class_repository.update_asset(asset_entity)
                    generation.status = GenerationStatus.COMPLETED_WITH_WARNINGS
                    generation.completed_at = datetime.now(UTC)
                self.unit_of_work.live_class_repository.update_generation(generation)
            logger.info(
                "Generation completed generation_id=%s plan_id=%s status=%s",
                generation_id,
                class_plan_id,
                generation.status.value,
            )
        except ValidationException as error:
            logger.exception(
                "Generation validation failed generation_id=%s plan_id=%s error=%s",
                generation_id,
                class_plan_id,
                error,
            )
            with self.unit_of_work:
                generation = self.unit_of_work.live_class_repository.find_generation_by_id(generation_id)
                if generation is not None:
                    generation.status = GenerationStatus.FAILED
                    generation.error_message = str(error)
                    generation.completed_at = datetime.now(UTC)
                    self.unit_of_work.live_class_repository.update_generation(generation)
            return None
        except Exception as error:
            logger.exception(
                "Generation failed generation_id=%s plan_id=%s error=%s",
                generation_id,
                class_plan_id,
                error,
            )
            with self.unit_of_work:
                generation = self.unit_of_work.live_class_repository.find_generation_by_id(generation_id)
                if generation is not None:
                    generation.status = GenerationStatus.FAILED
                    generation.error_message = str(error)
                    generation.completed_at = datetime.now(UTC)
                    self.unit_of_work.live_class_repository.update_generation(generation)
        return None

    @validate_call(validate_return=True)
    def validate_topic_pacing(self, topic_duration_minutes: int, slide_count: int) -> bool:
        minimum_slides = ceil(topic_duration_minutes * 60 / 45)
        return slide_count >= minimum_slides

    @validate_call(validate_return=False)
    def _require_llm_configuration(self) -> None:
        if settings.BEDROCK_MODEL_ID.strip() == "":
            raise ValidationException("BEDROCK_MODEL_ID is required for class generation")
        if settings.BEDROCK_REGION.strip() == "":
            raise ValidationException("BEDROCK_REGION is required for class generation")
