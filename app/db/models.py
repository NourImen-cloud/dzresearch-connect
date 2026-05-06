"""SQLAlchemy models for platform features."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="researcher", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ResearcherProfile(Base):
    __tablename__ = "researcher_profiles"

    id = Column(String(200), primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    location = Column(String(100), default="unknown")
    institution = Column(String(300), default="Unknown")
    country = Column(String(30), default="")
    h_index = Column(Integer, default=0)
    citations = Column(Integer, default=0)
    paper_count = Column(Integer, default=0)
    topics = Column(Text, default="")
    bio = Column(Text, default="")
    specialty = Column(String(300), default="")
    is_claimed = Column(Boolean, default=False, nullable=False)
    claimed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    claimed_by = relationship("User")


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    inviter_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    invitee_email = Column(String(200), nullable=False, index=True)
    token = Column(String(128), unique=True, nullable=False, index=True)
    status = Column(String(30), default="pending", nullable=False)
    expires_at = Column(DateTime, nullable=False)
    accepted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Paper(Base):
    __tablename__ = "papers"

    id = Column(String(200), primary_key=True, index=True)
    title = Column(Text, nullable=False)
    abstract = Column(Text, default="")
    year = Column(Integer, nullable=True)
    concepts = Column(Text, default="")


class ResearcherPaper(Base):
    __tablename__ = "researcher_papers"
    __table_args__ = (UniqueConstraint("researcher_id", "paper_id", name="uq_researcher_paper"),)

    id = Column(Integer, primary_key=True, index=True)
    researcher_id = Column(String(200), ForeignKey("researcher_profiles.id"), nullable=False)
    paper_id = Column(String(200), ForeignKey("papers.id"), nullable=False)
