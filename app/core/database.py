from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from app.config import settings

connect_arguments: dict = {"application_name": "teach-api"}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_arguments = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=1,
    max_overflow=0,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_use_lifo=True,
    connect_args=connect_arguments,
)
SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Session = scoped_session(SessionFactory)


def get_db() -> Generator[Session, None, None]:
    database_session = Session()
    try:
        yield database_session
    finally:
        Session.remove()
