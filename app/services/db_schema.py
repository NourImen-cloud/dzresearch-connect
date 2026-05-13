"""Lightweight SQLite schema adjustments (no Alembic in this project)."""

from sqlalchemy import inspect, text

from app.db.session import engine


def ensure_sqlite_user_profile_columns() -> None:
    """Add auth-related columns to users when missing (existing SQLite DBs)."""
    if engine.dialect.name != "sqlite":
        return
    insp = inspect(engine)
    if "users" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("users")}
    with engine.begin() as conn:
        if "linked_researcher_id" not in cols:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN linked_researcher_id VARCHAR(200)")
            )
        if "profile_listing_pending" not in cols:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN profile_listing_pending INTEGER NOT NULL DEFAULT 0"
                )
            )


def ensure_researcher_profile_extra_columns() -> None:
    """Add optional profile fields for claimed researchers (SQLite)."""
    if engine.dialect.name != "sqlite":
        return
    insp = inspect(engine)
    if "researcher_profiles" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("researcher_profiles")}
    with engine.begin() as conn:
        if "website" not in cols:
            conn.execute(text("ALTER TABLE researcher_profiles ADD COLUMN website VARCHAR(500) DEFAULT ''"))
        if "orcid" not in cols:
            conn.execute(text("ALTER TABLE researcher_profiles ADD COLUMN orcid VARCHAR(80) DEFAULT ''"))
        if "bio" not in cols:
            conn.execute(text("ALTER TABLE researcher_profiles ADD COLUMN bio TEXT DEFAULT ''"))
        if "specialty" not in cols:
            conn.execute(text("ALTER TABLE researcher_profiles ADD COLUMN specialty VARCHAR(300) DEFAULT ''"))
