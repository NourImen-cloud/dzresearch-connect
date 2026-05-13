"""Main FastAPI entry point for DZ Research Connect backend."""

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

from app.api.router import api_router
from app.db.models import Invitation, Paper, ResearcherProfile, User
from app.db.session import Base, SessionLocal, engine
from app.services.bootstrap import seed_database
from app.services.db_schema import (
    ensure_researcher_profile_extra_columns,
    ensure_sqlite_user_profile_columns,
)
from ai.recommender import warm_cache


app = FastAPI(
    title="DZ Research Connect Backend",
    version="2.0.0",
    description="Backend API for Algerian CS researchers platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_initialized = False


def initialize_database():
    global _initialized
    if _initialized:
        return
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_user_profile_columns()
    ensure_researcher_profile_extra_columns()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    _initialized = True


@app.on_event("startup")
def startup_event():
    initialize_database()
    # Note: warm_cache() is called on-demand to avoid blocking startup
    # The model will be loaded on first use


@app.get("/")
def root():
    initialize_database()
    return {"service": "DZ Research Connect", "status": "online", "version": "2.0.0"}


@app.get("/health")
def health():
    initialize_database()
    return {"status": "healthy"}


@app.get("/stats")
def stats():
    initialize_database()
    db = SessionLocal()
    try:
        total_researchers = db.query(ResearcherProfile).count()
        claimed_profiles = db.query(ResearcherProfile).filter(ResearcherProfile.is_claimed == True).count()
        total_users = db.query(User).count()
        total_papers = db.query(Paper).count()
        pending_invites = db.query(Invitation).filter(Invitation.status == "pending").count()

        # Count distinct non-empty countries
        total_countries = (
            db.query(ResearcherProfile.country)
            .filter(ResearcherProfile.country != "")
            .distinct()
            .count()
        )

        # Count distinct topics (topics field is comma-separated; count unique rows as proxy)
        total_topics = (
            db.query(ResearcherProfile.topics)
            .filter(ResearcherProfile.topics != "")
            .distinct()
            .count()
        )

        top_topics = (
            db.query(ResearcherProfile.topics, func.count(ResearcherProfile.id))
            .group_by(ResearcherProfile.topics)
            .order_by(func.count(ResearcherProfile.id).desc())
            .limit(5)
            .all()
        )
        return {
            "success": True,
            "data": {
                "total_researchers": total_researchers,
                "total_papers": total_papers,
                "topics": total_topics,
                "countries": total_countries,
                "claimed_profiles": claimed_profiles,
                "total_users": total_users,
                "pending_invites": pending_invites,
                "claim_ratio": round(claimed_profiles / total_researchers, 4) if total_researchers else 0,
                "top_topics": [{"topic": t[0], "count": t[1]} for t in top_topics],
            },
        }
    finally:
        db.close()


app.include_router(api_router)
initialize_database()
