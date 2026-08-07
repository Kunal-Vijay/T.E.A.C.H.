from __future__ import annotations

from types import TracebackType

from sqlalchemy.orm import Session

from app.domain.interfaces import IUnitOfWork
from app.infrastructure.repositories.class_plan_repository import ClassPlanRepository
from app.infrastructure.repositories.classroom_session_repository import ClassroomSessionRepository
from app.infrastructure.repositories.doubt_session_repository import DoubtSessionRepository
from app.infrastructure.repositories.live_class_repository import LiveClassRepository


class UnitOfWork(IUnitOfWork):
    def __init__(self, session: Session) -> None:
        self.session = session
        self.class_plan_repository = ClassPlanRepository(session)
        self.live_class_repository = LiveClassRepository(session)
        self.classroom_session_repository = ClassroomSessionRepository(session)
        self.doubt_session_repository = DoubtSessionRepository(session)

    def __enter__(self) -> IUnitOfWork:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        if exc_type is not None:
            self.session.rollback()
            return None
        self.session.commit()
        return None

    def commit(self) -> None:
        self.session.commit()
