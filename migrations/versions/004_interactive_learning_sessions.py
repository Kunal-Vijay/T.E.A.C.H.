from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "004_interactive_learning_sessions"
down_revision = "003_rename_teaching_notes_to_teaching_guidelines"
branch_labels = None
depends_on = None


def upgrade() -> None:
    topic_status = sa.Enum("draft", "published", "archived", name="topic_status")
    learning_mode = sa.Enum("teach", "doubt", "pop_quiz", "viva", name="learning_mode")
    learning_session_status = sa.Enum("active", "completed", "abandoned", name="learning_session_status")
    goal_status = sa.Enum("in_progress", "completed", name="goal_status")
    session_turn_role = sa.Enum("student", "tutor", "system", name="session_turn_role")
    input_channel = sa.Enum("chat", "speech", name="input_channel")

    topic_status.create(op.get_bind(), checkfirst=True)
    learning_mode.create(op.get_bind(), checkfirst=True)
    learning_session_status.create(op.get_bind(), checkfirst=True)
    goal_status.create(op.get_bind(), checkfirst=True)
    session_turn_role.create(op.get_bind(), checkfirst=True)
    input_channel.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "topics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("subject", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", topic_status, nullable=False),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "topic_toc_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("topics.id"), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("teaching_notes", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("topic_id", "order", name="uq_topic_toc_items_topic_order"),
    )
    op.create_table(
        "student_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_identifier", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("student_identifier", name="uq_student_profiles_student_identifier"),
    )
    op.create_table(
        "learning_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("topics.id"), nullable=False),
        sa.Column("mode", learning_mode, nullable=False),
        sa.Column("student_identifier", sa.String(255), nullable=False),
        sa.Column("params_snapshot", sa.JSON(), nullable=False),
        sa.Column("status", learning_session_status, nullable=False),
        sa.Column("goal_status", goal_status, nullable=False),
        sa.Column("taught_toc_item_ids", sa.JSON(), nullable=False),
        sa.Column("mode_state", sa.JSON(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "session_turns",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "learning_session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("learning_sessions.id"),
            nullable=False,
        ),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("role", session_turn_role, nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("input_channel", input_channel, nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("learning_session_id", "order", name="uq_session_turns_session_order"),
    )
    op.create_table(
        "session_visuals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "learning_session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("learning_sessions.id"),
            nullable=False,
        ),
        sa.Column(
            "session_turn_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("session_turns.id"),
            nullable=False,
        ),
        sa.Column("slides", sa.JSON(), nullable=False),
        sa.Column("explanation_text", sa.Text(), nullable=False),
        sa.Column("quiz_payload", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "session_quiz_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "learning_session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("learning_sessions.id"),
            nullable=False,
        ),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("selected_option_id", sa.String(100), nullable=True),
        sa.Column("student_answer_text", sa.Text(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.Column("explanation_text", sa.Text(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "viva_assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "learning_session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("learning_sessions.id"),
            nullable=False,
        ),
        sa.Column("weak_toc_item_ids", sa.JSON(), nullable=False),
        sa.Column("insight_summary", sa.Text(), nullable=False),
        sa.Column("question_evaluations", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("learning_session_id", name="uq_viva_assessments_session"),
    )


def downgrade() -> None:
    op.drop_table("viva_assessments")
    op.drop_table("session_quiz_attempts")
    op.drop_table("session_visuals")
    op.drop_table("session_turns")
    op.drop_table("learning_sessions")
    op.drop_table("student_profiles")
    op.drop_table("topic_toc_items")
    op.drop_table("topics")
    sa.Enum(name="input_channel").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="session_turn_role").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="goal_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="learning_session_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="learning_mode").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="topic_status").drop(op.get_bind(), checkfirst=True)
