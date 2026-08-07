from __future__ import annotations

from alembic import op

revision = "002_rename_gemini_model_to_llm_model"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("live_class_generations", "gemini_model", new_column_name="llm_model")


def downgrade() -> None:
    op.alter_column("live_class_generations", "llm_model", new_column_name="gemini_model")
