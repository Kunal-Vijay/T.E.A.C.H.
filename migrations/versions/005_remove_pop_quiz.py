from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "005_remove_pop_quiz"
down_revision = "004_interactive_learning_sessions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    op.execute(
        sa.text(
            "UPDATE learning_sessions "
            "SET status = 'abandoned', mode = 'teach', completed_at = CURRENT_TIMESTAMP "
            "WHERE mode = 'pop_quiz'"
        )
    )

    if dialect_name == "postgresql":
        op.execute(sa.text("ALTER TYPE learning_mode RENAME TO learning_mode_old"))
        learning_mode = postgresql.ENUM("teach", "doubt", "viva", name="learning_mode")
        learning_mode.create(bind, checkfirst=True)
        op.execute(
            sa.text(
                "ALTER TABLE learning_sessions "
                "ALTER COLUMN mode TYPE learning_mode "
                "USING mode::text::learning_mode"
            )
        )
        op.execute(sa.text("DROP TYPE learning_mode_old"))
    else:
        with op.batch_alter_table("learning_sessions") as batch_op:
            batch_op.alter_column(
                "mode",
                existing_type=sa.Enum("teach", "doubt", "pop_quiz", "viva", name="learning_mode"),
                type_=sa.Enum("teach", "doubt", "viva", name="learning_mode"),
                existing_nullable=False,
            )

    op.drop_table("session_quiz_attempts")
    op.drop_table("pop_quiz_attempts")
    op.drop_table("pop_quiz_questions")


def downgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    op.create_table(
        "pop_quiz_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("generation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_class_generations.id"), nullable=False),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("class_plan_topics.id"), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("options", sa.JSON(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "pop_quiz_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("classroom_sessions.id"), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pop_quiz_questions.id"), nullable=False),
        sa.Column("selected_option_id", sa.String(length=10), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("feedback_explanation", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "session_quiz_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("learning_session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("learning_sessions.id"), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("selected_option_id", sa.String(length=100), nullable=True),
        sa.Column("student_answer_text", sa.Text(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.Column("explanation_text", sa.Text(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    if dialect_name == "postgresql":
        op.execute(sa.text("ALTER TYPE learning_mode RENAME TO learning_mode_old"))
        learning_mode = postgresql.ENUM("teach", "doubt", "pop_quiz", "viva", name="learning_mode")
        learning_mode.create(bind, checkfirst=True)
        op.execute(
            sa.text(
                "ALTER TABLE learning_sessions "
                "ALTER COLUMN mode TYPE learning_mode "
                "USING mode::text::learning_mode"
            )
        )
        op.execute(sa.text("DROP TYPE learning_mode_old"))
    else:
        with op.batch_alter_table("learning_sessions") as batch_op:
            batch_op.alter_column(
                "mode",
                existing_type=sa.Enum("teach", "doubt", "viva", name="learning_mode"),
                type_=sa.Enum("teach", "doubt", "pop_quiz", "viva", name="learning_mode"),
                existing_nullable=False,
            )
