from __future__ import annotations

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session

from app.domain.entities import (
    GeneratedAssetEntity,
    LiveClassGenerationEntity,
    LiveClassSlideEntity,
    SlideExplanationEntity,
    TopicWorkflowEntity,
)
from app.domain.enums import AssetStatus, GenerationStatus
from app.domain.interfaces import ILiveClassRepository
from app.infrastructure.decorators import log_repo_call
from app.infrastructure.models.live_class_models import (
    GeneratedAssetModel,
    LiveClassGenerationModel,
    LiveClassSlideModel,
    SlideExplanationModel,
    TopicWorkflowModel,
)


class LiveClassRepository(ILiveClassRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    @log_repo_call
    @validate_call(validate_return=True)
    def create_generation(self, generation: LiveClassGenerationEntity) -> LiveClassGenerationEntity:
        model = LiveClassGenerationModel.from_entity(generation)
        self.session.add(model)
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def update_generation(self, generation: LiveClassGenerationEntity) -> LiveClassGenerationEntity:
        model = (
            self.session.query(LiveClassGenerationModel)
            .filter(LiveClassGenerationModel.id == generation.id, LiveClassGenerationModel.is_active.is_(True))
            .first()
        )
        if model is None:
            return generation
        model.status = generation.status
        model.error_message = generation.error_message
        model.started_at = generation.started_at
        model.completed_at = generation.completed_at
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def find_generation_by_id(self, generation_id: UUID) -> LiveClassGenerationEntity | None:
        model = (
            self.session.query(LiveClassGenerationModel)
            .filter(LiveClassGenerationModel.id == generation_id, LiveClassGenerationModel.is_active.is_(True))
            .first()
        )
        return model.to_entity() if model is not None else None

    @log_repo_call
    @validate_call(validate_return=True)
    def find_generations_by_plan_id(
        self, plan_id: UUID, offset: int, limit: int
    ) -> tuple[list[LiveClassGenerationEntity], int]:
        query = self.session.query(LiveClassGenerationModel).filter(
            LiveClassGenerationModel.class_plan_id == plan_id,
            LiveClassGenerationModel.is_active.is_(True),
        )
        total_count = query.count()
        models = query.order_by(LiveClassGenerationModel.created_at.desc()).offset(offset).limit(limit).all()
        return [model.to_entity() for model in models], total_count

    @log_repo_call
    @validate_call(validate_return=True)
    def find_latest_generation_by_plan_id(self, plan_id: UUID) -> LiveClassGenerationEntity | None:
        model = (
            self.session.query(LiveClassGenerationModel)
            .filter(LiveClassGenerationModel.class_plan_id == plan_id, LiveClassGenerationModel.is_active.is_(True))
            .order_by(LiveClassGenerationModel.created_at.desc())
            .first()
        )
        return model.to_entity() if model is not None else None

    @log_repo_call
    @validate_call(validate_return=True)
    def save_topic_workflow(self, workflow: TopicWorkflowEntity) -> TopicWorkflowEntity:
        model = TopicWorkflowModel.from_entity(workflow)
        self.session.add(model)
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=True)
    def save_slides(self, slides: list[LiveClassSlideEntity]) -> list[LiveClassSlideEntity]:
        models = [LiveClassSlideModel.from_entity(slide) for slide in slides]
        self.session.add_all(models)
        self.session.flush()
        return [model.to_entity() for model in models]

    @log_repo_call
    @validate_call(validate_return=True)
    def save_explanations(self, explanations: list[SlideExplanationEntity]) -> list[SlideExplanationEntity]:
        models = [SlideExplanationModel.from_entity(explanation) for explanation in explanations]
        self.session.add_all(models)
        self.session.flush()
        return [model.to_entity() for model in models]

    @log_repo_call
    @validate_call(validate_return=True)
    def save_assets(self, assets: list[GeneratedAssetEntity]) -> list[GeneratedAssetEntity]:
        models = [GeneratedAssetModel.from_entity(asset) for asset in assets]
        self.session.add_all(models)
        self.session.flush()
        return [model.to_entity() for model in models]

    @log_repo_call
    @validate_call(validate_return=True)
    def find_workflow_by_topic(self, generation_id: UUID, topic_id: UUID) -> TopicWorkflowEntity | None:
        model = (
            self.session.query(TopicWorkflowModel)
            .filter(
                TopicWorkflowModel.generation_id == generation_id,
                TopicWorkflowModel.topic_id == topic_id,
                TopicWorkflowModel.is_active.is_(True),
            )
            .first()
        )
        return model.to_entity() if model is not None else None

    @log_repo_call
    @validate_call(validate_return=True)
    def find_workflows_by_generation(self, generation_id: UUID) -> list[TopicWorkflowEntity]:
        models = (
            self.session.query(TopicWorkflowModel)
            .filter(TopicWorkflowModel.generation_id == generation_id, TopicWorkflowModel.is_active.is_(True))
            .order_by(TopicWorkflowModel.created_at.asc())
            .all()
        )
        return [model.to_entity() for model in models]

    @log_repo_call
    @validate_call(validate_return=True)
    def find_slides_by_state(
        self, generation_id: UUID, topic_id: UUID, workflow_state_id: str
    ) -> list[LiveClassSlideEntity]:
        models = (
            self.session.query(LiveClassSlideModel)
            .filter(
                LiveClassSlideModel.generation_id == generation_id,
                LiveClassSlideModel.topic_id == topic_id,
                LiveClassSlideModel.workflow_state_id == workflow_state_id,
                LiveClassSlideModel.is_active.is_(True),
            )
            .order_by(LiveClassSlideModel.order.asc())
            .all()
        )
        return [model.to_entity() for model in models]

    @log_repo_call
    @validate_call(validate_return=True)
    def find_explanation_by_slide_id(self, slide_id: UUID) -> SlideExplanationEntity | None:
        model = (
            self.session.query(SlideExplanationModel)
            .filter(SlideExplanationModel.slide_id == slide_id, SlideExplanationModel.is_active.is_(True))
            .first()
        )
        return model.to_entity() if model is not None else None

    @log_repo_call
    @validate_call(validate_return=True)
    def find_pending_assets_by_generation(self, generation_id: UUID) -> list[GeneratedAssetEntity]:
        models = (
            self.session.query(GeneratedAssetModel)
            .filter(
                GeneratedAssetModel.generation_id == generation_id,
                GeneratedAssetModel.status == AssetStatus.PENDING,
                GeneratedAssetModel.is_active.is_(True),
            )
            .all()
        )
        return [model.to_entity() for model in models]

    @log_repo_call
    @validate_call(validate_return=True)
    def find_asset_by_id(self, asset_id: UUID) -> GeneratedAssetEntity | None:
        model = (
            self.session.query(GeneratedAssetModel)
            .filter(GeneratedAssetModel.id == asset_id, GeneratedAssetModel.is_active.is_(True))
            .first()
        )
        return model.to_entity() if model is not None else None

    @log_repo_call
    @validate_call(validate_return=True)
    def update_asset(self, asset: GeneratedAssetEntity) -> GeneratedAssetEntity:
        model = (
            self.session.query(GeneratedAssetModel)
            .filter(GeneratedAssetModel.id == asset.id, GeneratedAssetModel.is_active.is_(True))
            .first()
        )
        if model is None:
            return asset
        model.storage_url = asset.storage_url
        model.status = asset.status
        model.error_message = asset.error_message
        self.session.flush()
        return model.to_entity()

    @log_repo_call
    @validate_call(validate_return=False)
    def update_slide_elements(self, slide_id: UUID, elements: list[dict]) -> None:
        model = (
            self.session.query(LiveClassSlideModel)
            .filter(LiveClassSlideModel.id == slide_id, LiveClassSlideModel.is_active.is_(True))
            .first()
        )
        if model is not None:
            model.elements = elements
            self.session.flush()

    @log_repo_call
    @validate_call(validate_return=True)
    def count_assets_by_generation(self, generation_id: UUID) -> tuple[int, int]:
        total_count = (
            self.session.query(GeneratedAssetModel)
            .filter(GeneratedAssetModel.generation_id == generation_id, GeneratedAssetModel.is_active.is_(True))
            .count()
        )
        completed_count = (
            self.session.query(GeneratedAssetModel)
            .filter(
                GeneratedAssetModel.generation_id == generation_id,
                GeneratedAssetModel.status == AssetStatus.COMPLETED,
                GeneratedAssetModel.is_active.is_(True),
            )
            .count()
        )
        return total_count, completed_count

    @log_repo_call
    @validate_call(validate_return=True)
    def count_slides_by_generation(self, generation_id: UUID) -> int:
        return (
            self.session.query(LiveClassSlideModel)
            .filter(LiveClassSlideModel.generation_id == generation_id, LiveClassSlideModel.is_active.is_(True))
            .count()
        )
