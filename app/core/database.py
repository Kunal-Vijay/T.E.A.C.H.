from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings

connect_arguments: dict[str, object] = {}
engine_kwargs: dict[str, object] = {
    "pool_pre_ping": True,
}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_arguments["check_same_thread"] = False
    connect_arguments["timeout"] = 30
    engine_kwargs["poolclass"] = NullPool
else:
    connect_arguments["application_name"] = "teach-api"
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_recycle"] = 3600
    engine_kwargs["pool_use_lifo"] = True

engine_kwargs["connect_args"] = connect_arguments

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@event.listens_for(engine, "connect")
def configure_sqlite_connection(database_connection, _connection_record) -> None:
    if not settings.DATABASE_URL.startswith("sqlite"):
        return None
    cursor = database_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.close()
    return None


def get_db() -> Generator[Session, None, None]:
    database_session = SessionFactory()
    try:
        yield database_session
    finally:
        database_session.close()
