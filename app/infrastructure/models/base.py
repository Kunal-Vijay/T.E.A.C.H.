from typing import Any

from sqlalchemy import Boolean, Column, DateTime, MetaData, func, text
from sqlalchemy import inspect as sqlalchemy_inspect
from sqlalchemy.orm import as_declarative

convention = {
    "ix": "ix_%(column_0_N_label)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=convention)


@as_declarative(metadata=metadata)
class Base:
    id: Any
    __name__: str

    def is_relationship_loaded(self, relationship_name: str) -> bool:
        instance_state = sqlalchemy_inspect(self)
        return relationship_name not in instance_state.unloaded

    def get_list_relationship_or_empty(self, relationship_name: str) -> list:
        if not self.is_relationship_loaded(relationship_name):
            return []
        return getattr(self, relationship_name, [])

    def get_single_relationship_or_none(self, relationship_name: str):
        if not self.is_relationship_loaded(relationship_name):
            return None
        return getattr(self, relationship_name, None)


class SoftDeleteMixin:
    is_active = Column(Boolean, server_default=text("TRUE"), default=True)


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
