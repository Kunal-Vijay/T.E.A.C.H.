from __future__ import annotations

from app.core.database import engine
from app.infrastructure.models import Base


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    initialize_database()
    print("Database initialized")
