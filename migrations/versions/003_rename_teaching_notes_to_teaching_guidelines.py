from __future__ import annotations

from alembic import op

revision = "003_rename_teaching_notes_to_teaching_guidelines"
down_revision = "002_rename_gemini_model_to_llm_model"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("class_plan_topics", "teaching_notes", new_column_name="teaching_guidelines")


def downgrade() -> None:
    op.alter_column("class_plan_topics", "teaching_guidelines", new_column_name="teaching_notes")
