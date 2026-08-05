"""initial live class schema

Revision ID: 001_initial
Revises:
Create Date: 2026-08-06
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "class_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("subject", sa.String(100), nullable=False),
        sa.Column("grade", sa.String(50), nullable=False),
        sa.Column("class_label", sa.String(100), nullable=False),
        sa.Column("chapter_name", sa.String(255), nullable=False),
        sa.Column("chapter_number", sa.Integer(), nullable=True),
        sa.Column("target_exam", sa.String(100), nullable=False),
        sa.Column("language_code", sa.String(10), nullable=False),
        sa.Column("total_duration_minutes", sa.Integer(), nullable=False),
        sa.Column("status", sa.Enum("draft", "published", "archived", name="plan_status"), nullable=False),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
    )
    op.create_table(
        "class_plan_topics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("class_plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("class_plans.id"), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("base_material", sa.Text(), nullable=False),
        sa.Column("teaching_notes", postgresql.JSONB(), nullable=False),
        sa.Column("miscellaneous_notes", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
        sa.UniqueConstraint("class_plan_id", "order", name="uq_class_plan_topics_plan_order"),
    )
    op.create_table(
        "live_class_generations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("class_plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("class_plans.id"), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "generating_content",
                "generating_images",
                "completed",
                "completed_with_warnings",
                "failed",
                name="generation_status",
            ),
            nullable=False,
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("gemini_model", sa.String(100), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
    )
    op.create_table(
        "topic_workflows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("generation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_class_generations.id"), nullable=False),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("class_plan_topics.id"), nullable=False),
        sa.Column(
            "teaching_approach",
            sa.Enum("direct_instruction", "inquiry_based", name="teaching_approach"),
            nullable=False,
        ),
        sa.Column("approach_rationale", sa.Text(), nullable=False),
        sa.Column("workflow_definition", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
        sa.UniqueConstraint("generation_id", "topic_id", name="uq_topic_workflows_generation_topic"),
    )
    op.create_table(
        "live_class_slides",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("generation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_class_generations.id"), nullable=False),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("class_plan_topics.id"), nullable=False),
        sa.Column("workflow_state_id", sa.String(100), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("layout", sa.String(100), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("elements", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
    )
    op.create_table(
        "slide_explanations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("generation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_class_generations.id"), nullable=False),
        sa.Column("slide_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_class_slides.id"), unique=True, nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("explanation_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
    )
    op.create_table(
        "pop_quiz_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("generation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_class_generations.id"), nullable=False),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("class_plan_topics.id"), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("options", postgresql.JSONB(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
    )
    op.create_table(
        "classroom_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("generation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_class_generations.id"), nullable=False),
        sa.Column("current_topic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("class_plan_topics.id"), nullable=True),
        sa.Column("current_state_id", sa.String(100), nullable=True),
        sa.Column(
            "session_status",
            sa.Enum("active", "paused", "completed", name="classroom_session_status"),
            nullable=False,
        ),
        sa.Column("student_identifier", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
    )
    op.create_table(
        "pop_quiz_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("classroom_sessions.id"), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pop_quiz_questions.id"), nullable=False),
        sa.Column("selected_option_id", sa.String(10), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("feedback_explanation", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
    )
    op.create_table(
        "doubt_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("classroom_session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("classroom_sessions.id"), nullable=False),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("class_plan_topics.id"), nullable=False),
        sa.Column("generation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_class_generations.id"), nullable=False),
        sa.Column("status", sa.Enum("active", "closed", name="doubt_session_status"), nullable=False),
        sa.Column("topic_context", postgresql.JSONB(), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
    )
    op.create_table(
        "doubt_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("doubt_session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("doubt_sessions.id"), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("student_message", sa.Text(), nullable=False),
        sa.Column("ai_response", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
    )
    op.create_table(
        "generated_assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("generation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_class_generations.id"), nullable=False),
        sa.Column("slide_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_class_slides.id"), nullable=False),
        sa.Column("element_id", sa.String(100), nullable=False),
        sa.Column("generation_prompt", sa.Text(), nullable=False),
        sa.Column("storage_url", sa.String(1000), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "generating", "completed", "failed", name="asset_status"),
            nullable=False,
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("generated_assets")
    op.drop_table("doubt_messages")
    op.drop_table("doubt_sessions")
    op.drop_table("pop_quiz_attempts")
    op.drop_table("classroom_sessions")
    op.drop_table("pop_quiz_questions")
    op.drop_table("slide_explanations")
    op.drop_table("live_class_slides")
    op.drop_table("topic_workflows")
    op.drop_table("live_class_generations")
    op.drop_table("class_plan_topics")
    op.drop_table("class_plans")
    sa.Enum(name="asset_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="doubt_session_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="classroom_session_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="teaching_approach").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="generation_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="plan_status").drop(op.get_bind(), checkfirst=True)
