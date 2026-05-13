"""Helpers for researcher ID normalization and profile claim sync."""

import re
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models import ResearcherProfile, User


def normalize_openalex_author_id(raw: Optional[str]) -> str:
    """Normalize user input to canonical OpenAlex author URL used in the database."""
    if not raw:
        return ""
    s = raw.strip().split("?")[0].strip().rstrip("/")
    if not s:
        return ""
    if s.startswith("https://openalex.org/"):
        return s
    if s.startswith("http://openalex.org/"):
        return "https://openalex.org/" + s[len("http://openalex.org/") :].lstrip("/")
    low = s.lower()
    if "openalex.org/" in low:
        i = low.index("openalex.org/")
        tail = s[i + len("openalex.org/") :].lstrip("/")
        part = tail.split("/")[0]
        if part:
            return f"https://openalex.org/{part}"
    if re.fullmatch(r"A\d{9,}", s):
        return f"https://openalex.org/{s}"
    return s


def refresh_listing_and_claim(db: Session, user: User) -> None:
    """
    If the user linked an OpenAlex author id, refresh listing-pending state and
    claim the profile when it exists in the catalog.
    """
    if not user.linked_researcher_id:
        return
    profile = (
        db.query(ResearcherProfile)
        .filter(ResearcherProfile.id == user.linked_researcher_id)
        .first()
    )
    if profile:
        user.profile_listing_pending = False
        if not profile.is_claimed or profile.claimed_by_user_id == user.id:
            profile.is_claimed = True
            profile.claimed_by_user_id = user.id
            profile.updated_at = datetime.utcnow()
    else:
        user.profile_listing_pending = True


def user_has_claimed_profile(db: Session, user: User) -> bool:
    if not user.linked_researcher_id:
        return False
    p = (
        db.query(ResearcherProfile)
        .filter(ResearcherProfile.id == user.linked_researcher_id)
        .first()
    )
    return bool(p and p.is_claimed and p.claimed_by_user_id == user.id)
