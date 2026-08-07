from __future__ import annotations

from abc import ABC, abstractmethod
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities import (
    ClassPlanEntity,
    ClassPlanTopicEntity,
    ClassroomSessionEntity,
    DoubtMessageEntity,
    DoubtSessionEntity,
    GeneratedAssetEntity,
    LearningSessionEntity,
    LiveClassGenerationEntity,
    LiveClassSlideEntity,
    PopQuizAttemptEntity,
    PopQuizQuestionEntity,
    SessionQuizAttemptEntity,
    SessionTurnEntity,
    SessionVisualEntity,
    SlideExplanationEntity,
    StudentProfileEntity,
    TopicEntity,
    TopicTocItemEntity,
    TopicWorkflowEntity,
    VivaAssessmentEntity,
)
from app.domain.enums import GenerationStatus, PlanStatus, TopicStatus, VivaAdvanceReason
from app.domain.student_params import StudentParamsSnapshot


class IClassPlanRepository(ABC):
    @abstractmethod
    def create(self, class_plan: ClassPlanEntity) -> ClassPlanEntity:
        pass

    @abstractmethod
    def update(self, class_plan: ClassPlanEntity) -> ClassPlanEntity:
        pass

    @abstractmethod
    def find_by_id(self, plan_id: UUID) -> ClassPlanEntity | None:
        pass

    @abstractmethod
    def find_all(
        self,
        subject: str | None,
        grade: str | None,
        target_exam: str | None,
        status: PlanStatus | None,
        offset: int,
        limit: int,
    ) -> tuple[list[ClassPlanEntity], int]:
        pass

    @abstractmethod
    def update_status(self, plan_id: UUID, status: PlanStatus) -> ClassPlanEntity:
        pass

    @abstractmethod
    def soft_delete(self, plan_id: UUID) -> None:
        pass


class ILiveClassRepository(ABC):
    @abstractmethod
    def create_generation(self, generation: LiveClassGenerationEntity) -> LiveClassGenerationEntity:
        pass

    @abstractmethod
    def update_generation(self, generation: LiveClassGenerationEntity) -> LiveClassGenerationEntity:
        pass

    @abstractmethod
    def find_generation_by_id(self, generation_id: UUID) -> LiveClassGenerationEntity | None:
        pass

    @abstractmethod
    def find_generations_by_plan_id(
        self, plan_id: UUID, offset: int, limit: int
    ) -> tuple[list[LiveClassGenerationEntity], int]:
        pass

    @abstractmethod
    def find_latest_generation_by_plan_id(self, plan_id: UUID) -> LiveClassGenerationEntity | None:
        pass

    @abstractmethod
    def save_topic_workflow(self, workflow: TopicWorkflowEntity) -> TopicWorkflowEntity:
        pass

    @abstractmethod
    def save_slides(self, slides: list[LiveClassSlideEntity]) -> list[LiveClassSlideEntity]:
        pass

    @abstractmethod
    def save_explanations(self, explanations: list[SlideExplanationEntity]) -> list[SlideExplanationEntity]:
        pass

    @abstractmethod
    def save_quiz_questions(self, questions: list[PopQuizQuestionEntity]) -> list[PopQuizQuestionEntity]:
        pass

    @abstractmethod
    def save_assets(self, assets: list[GeneratedAssetEntity]) -> list[GeneratedAssetEntity]:
        pass

    @abstractmethod
    def find_workflow_by_topic(
        self, generation_id: UUID, topic_id: UUID
    ) -> TopicWorkflowEntity | None:
        pass

    @abstractmethod
    def find_workflows_by_generation(self, generation_id: UUID) -> list[TopicWorkflowEntity]:
        pass

    @abstractmethod
    def find_slides_by_state(
        self, generation_id: UUID, topic_id: UUID, workflow_state_id: str
    ) -> list[LiveClassSlideEntity]:
        pass

    @abstractmethod
    def find_explanation_by_slide_id(self, slide_id: UUID) -> SlideExplanationEntity | None:
        pass

    @abstractmethod
    def find_quiz_questions_by_ids(self, question_ids: list[UUID]) -> list[PopQuizQuestionEntity]:
        pass

    @abstractmethod
    def find_quiz_questions_by_topic(self, generation_id: UUID, topic_id: UUID) -> list[PopQuizQuestionEntity]:
        pass

    @abstractmethod
    def find_quiz_question_by_id(self, question_id: UUID) -> PopQuizQuestionEntity | None:
        pass

    @abstractmethod
    def find_pending_assets_by_generation(self, generation_id: UUID) -> list[GeneratedAssetEntity]:
        pass

    @abstractmethod
    def find_asset_by_id(self, asset_id: UUID) -> GeneratedAssetEntity | None:
        pass

    @abstractmethod
    def update_asset(self, asset: GeneratedAssetEntity) -> GeneratedAssetEntity:
        pass

    @abstractmethod
    def update_slide_elements(self, slide_id: UUID, elements: list[dict]) -> None:
        pass

    @abstractmethod
    def count_assets_by_generation(self, generation_id: UUID) -> tuple[int, int]:
        pass

    @abstractmethod
    def count_slides_by_generation(self, generation_id: UUID) -> int:
        pass


class IClassroomSessionRepository(ABC):
    @abstractmethod
    def create(self, session: ClassroomSessionEntity) -> ClassroomSessionEntity:
        pass

    @abstractmethod
    def update(self, session: ClassroomSessionEntity) -> ClassroomSessionEntity:
        pass

    @abstractmethod
    def find_by_id(self, session_id: UUID) -> ClassroomSessionEntity | None:
        pass

    @abstractmethod
    def create_quiz_attempt(self, attempt: PopQuizAttemptEntity) -> PopQuizAttemptEntity:
        pass

    @abstractmethod
    def find_quiz_attempts_by_session_and_questions(
        self, session_id: UUID, question_ids: list[UUID]
    ) -> list[PopQuizAttemptEntity]:
        pass

    @abstractmethod
    def find_quiz_attempts_by_session_and_topic(
        self, session_id: UUID, generation_id: UUID, topic_id: UUID
    ) -> list[PopQuizAttemptEntity]:
        pass


class IDoubtSessionRepository(ABC):
    @abstractmethod
    def create(self, doubt_session: DoubtSessionEntity) -> DoubtSessionEntity:
        pass

    @abstractmethod
    def update(self, doubt_session: DoubtSessionEntity) -> DoubtSessionEntity:
        pass

    @abstractmethod
    def find_by_id(self, doubt_session_id: UUID) -> DoubtSessionEntity | None:
        pass

    @abstractmethod
    def find_active_by_session_and_topic(
        self, classroom_session_id: UUID, topic_id: UUID
    ) -> DoubtSessionEntity | None:
        pass

    @abstractmethod
    def create_message(self, message: DoubtMessageEntity) -> DoubtMessageEntity:
        pass

    @abstractmethod
    def find_messages_by_session(self, doubt_session_id: UUID) -> list[DoubtMessageEntity]:
        pass


class IQueueClient(ABC):
    @abstractmethod
    def send_content_generation_message(self, generation_id: UUID, class_plan_id: UUID) -> None:
        pass

    @abstractmethod
    def send_image_generation_message(self, asset_id: UUID, generation_id: UUID) -> None:
        pass


class IStorageClient(ABC):
    @abstractmethod
    def upload_image(self, asset_id: UUID, image_bytes: bytes, content_type: str) -> str:
        pass


class ILLMWorkflowClient(ABC):
    @abstractmethod
    def generate_topic_workflow(self, class_plan: ClassPlanEntity, topic: ClassPlanTopicEntity) -> dict:
        pass


class ILLMDoubtClient(ABC):
    @abstractmethod
    def resolve_doubt(
        self,
        topic_context: dict,
        conversation_history: list[dict],
        student_message: str,
    ) -> str:
        pass


class ILLMImageClient(ABC):
    @abstractmethod
    def generate_image(self, generation_prompt: str) -> bytes | None:
        pass


class ITopicRepository(ABC):
    @abstractmethod
    def create(self, topic: TopicEntity) -> TopicEntity:
        pass

    @abstractmethod
    def update(self, topic: TopicEntity) -> TopicEntity:
        pass

    @abstractmethod
    def find_by_id(self, topic_id: UUID) -> TopicEntity | None:
        pass

    @abstractmethod
    def find_all(
        self,
        subject: str | None,
        status: TopicStatus | None,
        offset: int,
        limit: int,
    ) -> tuple[list[TopicEntity], int]:
        pass

    @abstractmethod
    def update_status(self, topic_id: UUID, status: TopicStatus) -> TopicEntity:
        pass

    @abstractmethod
    def soft_delete(self, topic_id: UUID) -> None:
        pass

    @abstractmethod
    def replace_toc_items(self, topic_id: UUID, toc_items: list[TopicTocItemEntity]) -> TopicEntity:
        pass


class IStudentProfileRepository(ABC):
    @abstractmethod
    def upsert(self, profile: StudentProfileEntity) -> StudentProfileEntity:
        pass

    @abstractmethod
    def find_by_student_identifier(self, student_identifier: str) -> StudentProfileEntity | None:
        pass


class ILearningSessionRepository(ABC):
    @abstractmethod
    def create(self, learning_session: LearningSessionEntity) -> LearningSessionEntity:
        pass

    @abstractmethod
    def update(self, learning_session: LearningSessionEntity) -> LearningSessionEntity:
        pass

    @abstractmethod
    def find_by_id(self, session_id: UUID) -> LearningSessionEntity | None:
        pass

    @abstractmethod
    def create_turn(self, turn: SessionTurnEntity) -> SessionTurnEntity:
        pass

    @abstractmethod
    def create_visual(self, visual: SessionVisualEntity) -> SessionVisualEntity:
        pass

    @abstractmethod
    def create_quiz_attempt(self, attempt: SessionQuizAttemptEntity) -> SessionQuizAttemptEntity:
        pass

    @abstractmethod
    def upsert_viva_assessment(self, assessment: VivaAssessmentEntity) -> VivaAssessmentEntity:
        pass

    @abstractmethod
    def find_turns_by_session(self, session_id: UUID) -> list[SessionTurnEntity]:
        pass

    @abstractmethod
    def find_latest_visual(self, session_id: UUID) -> SessionVisualEntity | None:
        pass


class ILLMTeachClient(ABC):
    @abstractmethod
    def generate_teach_turn(
        self,
        topic: TopicEntity,
        params: StudentParamsSnapshot,
        conversation_history: list[dict],
        taught_toc_item_ids: list[str],
        student_message: str | None,
    ) -> dict:
        pass


class ILLMInteractiveDoubtClient(ABC):
    @abstractmethod
    def generate_doubt_turn(
        self,
        topic: TopicEntity,
        params: StudentParamsSnapshot,
        conversation_history: list[dict],
        student_message: str,
    ) -> dict:
        pass


class ILLMPopQuizClient(ABC):
    @abstractmethod
    def generate_pop_quiz_turn(
        self,
        topic: TopicEntity,
        params: StudentParamsSnapshot,
        conversation_history: list[dict],
        mode_state: dict,
        student_message: str | None,
    ) -> dict:
        pass


class ILLMVivaClient(ABC):
    @abstractmethod
    def generate_viva_turn(
        self,
        topic: TopicEntity,
        params: StudentParamsSnapshot,
        conversation_history: list[dict],
        mode_state: dict,
        student_message: str | None,
        advance_reason: VivaAdvanceReason | None,
    ) -> dict:
        pass


class IUnitOfWork(ABC):
    session: Session
    class_plan_repository: IClassPlanRepository
    live_class_repository: ILiveClassRepository
    classroom_session_repository: IClassroomSessionRepository
    doubt_session_repository: IDoubtSessionRepository
    topic_repository: ITopicRepository
    student_profile_repository: IStudentProfileRepository
    learning_session_repository: ILearningSessionRepository

    @abstractmethod
    def __enter__(self) -> IUnitOfWork:
        pass

    @abstractmethod
    def __exit__(self, exc_type, exc_val, traceback) -> None:
        pass

    @abstractmethod
    def commit(self) -> None:
        pass
