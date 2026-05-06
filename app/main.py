"""Main FastAPI entry point for DZ Research Connect backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

from app.api.router import api_router
from app.db.models import Invitation, Paper, ResearcherProfile, User
from app.db.session import Base, SessionLocal, engine
from app.services.bootstrap import seed_database


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
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    _initialized = True


@app.on_event("startup")
def startup_event():
    initialize_database()


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
                "claimed_profiles": claimed_profiles,
                "total_users": total_users,
                "total_papers": total_papers,
                "pending_invites": pending_invites,
                "claim_ratio": round(claimed_profiles / total_researchers, 4) if total_researchers else 0,
                "top_topics": [{"topic": t[0], "count": t[1]} for t in top_topics],
            },
        }
    finally:
        db.close()


app.include_router(api_router)
initialize_database()
