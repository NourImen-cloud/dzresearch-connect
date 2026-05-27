"""Main FastAPI entry point for DZ Research Connect backend."""

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import json
import os
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
from sqlalchemy import func, or_

from app.api.router import api_router
from app.db.models import Invitation, Paper, ResearcherProfile, User
from app.db.session import Base, SessionLocal, engine
from app.services.bootstrap import seed_database
from app.services.db_schema import (
    ensure_researcher_profile_extra_columns,
    ensure_sqlite_user_profile_columns,
)
from app.services.embedding_service import create_embedding, compute_similarity


groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
    create_embedding("test")


@app.get("/")
def root():
    initialize_database()
    return {
        "service": "DZ Research Connect",
        "status": "online",
        "version": "2.0.0",
    }


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
        claimed_profiles = (
            db.query(ResearcherProfile)
            .filter(ResearcherProfile.is_claimed == True)
            .count()
        )
        total_users = db.query(User).count()
        total_papers = db.query(Paper).count()
        pending_invites = (
            db.query(Invitation)
            .filter(Invitation.status == "pending")
            .count()
        )

        total_countries = (
            db.query(ResearcherProfile.country)
            .filter(ResearcherProfile.country != "")
            .distinct()
            .count()
        )

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
                "claim_ratio": (
                    round(claimed_profiles / total_researchers, 4)
                    if total_researchers
                    else 0
                ),
                "top_topics": [
                    {"topic": topic, "count": count}
                    for topic, count in top_topics
                ],
            },
        }

    finally:
        db.close()


class ChatRequest(BaseModel):
    message: str


class ChatResearcher(BaseModel):
    id: str
    name: str
    institution: str
    location: str
    topics: str
    paper_count: int
    is_claimed: bool


class ChatPaper(BaseModel):
    id: str
    title: str
    year: Optional[int] = None
    concepts: str


class ChatResponse(BaseModel):
    answer: str
    query: str
    researchers: List[ChatResearcher]
    papers: List[ChatPaper]


def extract_query_info(message: str):
    prompt = f"""
Extract the user intent from this message.

Message:
"{message}"

Return ONLY valid JSON in this format:

{{
  "intent": "researchers|papers|both",
  "topic": "clean topic",
  "limit": 5
}}

Examples:

"find 2 papers about NLP"
=>
{{
  "intent": "papers",
  "topic": "natural language processing",
  "limit": 2
}}

"who works on AI"
=>
{{
  "intent": "researchers",
  "topic": "artificial intelligence",
  "limit": 5
}}
"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
        )

        content = completion.choices[0].message.content.strip()
        parsed = json.loads(content)

    except Exception:
        parsed = {
            "intent": "both",
            "topic": message,
            "limit": 5,
        }

    return parsed


@app.post("/chat", response_model=ChatResponse, tags=["Chat Assistant"])
def chat(request: ChatRequest):
    initialize_database()

    db = SessionLocal()

    try:
        parsed = extract_query_info(request.message)

        intent = parsed.get("intent", "both")
        query = parsed.get("topic", request.message)
        limit = parsed.get("limit", 5)

        try:
            limit = int(limit)
        except Exception:
            limit = 5

        limit = max(1, min(limit, 10))
        query = query.lower().strip()

        topic_aliases = {
            "nlp": "natural language processing",
            "natural language processing nlp": "natural language processing",
            "ai": "artificial intelligence",
            "ml": "machine learning",
            "cv": "computer vision",
            "computer vision cv": "computer vision",
        }

        query = topic_aliases.get(query, query)

        researchers = []
        papers = []

        if intent in ["researchers", "both"]:
            all_researchers = db.query(ResearcherProfile).all()
            query_embedding = create_embedding(query)
            scored_researchers = []

            for r in all_researchers:
                text = f"""
                {r.name or ""}
                {r.topics or ""}
                {r.specialty or ""}
                {r.bio or ""}
                {r.institution or ""}
                """

                researcher_embedding = create_embedding(text)
                score = compute_similarity(query_embedding, researcher_embedding)
                scored_researchers.append((score, r))

            scored_researchers.sort(reverse=True, key=lambda x: x[0])
            top_researchers = [r for score, r in scored_researchers[:limit]]

            researchers = [
                ChatResearcher(
                    id=str(r.id),
                    name=r.name or "",
                    institution=r.institution or "",
                    location=r.location or r.country or "",
                    topics=r.topics or "",
                    paper_count=r.paper_count or 0,
                    is_claimed=bool(r.is_claimed),
                )
                for r in top_researchers
            ]

        if intent in ["papers", "both"]:
            paper_rows = (
                db.query(Paper)
                .filter(
                    or_(
                        Paper.title.ilike(f"%{query}%"),
                        Paper.abstract.ilike(f"%{query}%"),
                        Paper.concepts.ilike(f"%{query}%"),
                    )
                )
                .limit(limit)
                .all()
            )

            papers = [
                ChatPaper(
                    id=str(p.id),
                    title=p.title or "",
                    year=p.year,
                    concepts=p.concepts or "",
                )
                for p in paper_rows
            ]

        if researchers or papers:
            answer = ""
        else:
            answer = "No matching results were found in the platform database."

        return ChatResponse(
            answer=answer,
            query=query,
            researchers=researchers,
            papers=papers,
        )

    finally:
        db.close()


app.include_router(api_router)

initialize_database()