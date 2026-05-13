"""Simple research assistant chatbot endpoint.

This is intentionally lightweight: it does not call an external LLM.
It parses the user's question, searches the local researchers/papers database,
and returns a short answer plus matching items for the frontend.
"""

from typing import Literal, Optional
import re

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.models import Paper, ResearcherProfile
from app.db.session import get_db

router = APIRouter(prefix="/chat", tags=["Chat Assistant"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class ChatResearcher(BaseModel):
    id: str
    name: str
    institution: str = "Unknown"
    location: str = "Unknown"
    topics: str = ""
    paper_count: int = 0
    is_claimed: bool = False


class ChatPaper(BaseModel):
    id: str
    title: str
    year: Optional[int] = None
    concepts: str = ""
    abstract: str = ""


class ChatResponse(BaseModel):
    answer: str
    intent: Literal["researchers", "papers", "both"]
    query: str
    researchers: list[ChatResearcher]
    papers: list[ChatPaper]


STOP_WORDS = {
    "show", "find", "give", "me", "list", "about", "who", "works", "work", "working",
    "researcher", "researchers", "paper", "papers", "publication", "publications",
    "in", "on", "of", "for", "the", "a", "an", "and", "or", "both", "field", "domain",
    "topic", "topics", "related", "to", "with", "please", "can", "you", "i", "want",
}


def _detect_intent(text: str) -> Literal["researchers", "papers", "both"]:
    lower = text.lower()
    wants_researchers = any(word in lower for word in ["researcher", "researchers", "expert", "experts", "people", "authors"])
    wants_papers = any(word in lower for word in ["paper", "papers", "publication", "publications", "article", "articles"])
    if wants_researchers and wants_papers:
        return "both"
    if wants_papers:
        return "papers"
    if wants_researchers:
        return "researchers"
    return "both"


def _extract_query(text: str) -> str:
    lower = text.lower()

    # Prefer text after common phrases like "in NLP" or "about computer vision".
    match = re.search(r"(?:in|on|about|for|related to|field of)\s+(.+)$", lower)
    if match:
        candidate = match.group(1)
    else:
        candidate = lower

    words = re.findall(r"[a-zA-Z0-9]+", candidate)
    kept = [w for w in words if w not in STOP_WORDS and len(w) > 1]
    if not kept:
        kept = [w for w in re.findall(r"[a-zA-Z0-9]+", lower) if w not in STOP_WORDS and len(w) > 1]
    return " ".join(kept).strip()


def _search_researchers(db: Session, query: str, limit: int = 5) -> list[ResearcherProfile]:
    q = db.query(ResearcherProfile)
    if query:
        like = f"%{query}%"
        words = [w for w in query.split() if len(w) > 1]
        conditions = [
            ResearcherProfile.name.ilike(like),
            ResearcherProfile.institution.ilike(like),
            ResearcherProfile.topics.ilike(like),
            ResearcherProfile.specialty.ilike(like),
            ResearcherProfile.bio.ilike(like),
        ]
        for word in words:
            wlike = f"%{word}%"
            conditions.extend([
                ResearcherProfile.topics.ilike(wlike),
                ResearcherProfile.specialty.ilike(wlike),
                ResearcherProfile.institution.ilike(wlike),
            ])
        q = q.filter(or_(*conditions))
    return q.order_by(ResearcherProfile.paper_count.desc()).limit(limit).all()


def _search_papers(db: Session, query: str, limit: int = 5) -> list[Paper]:
    q = db.query(Paper)
    if query:
        like = f"%{query}%"
        words = [w for w in query.split() if len(w) > 1]
        conditions = [Paper.title.ilike(like), Paper.concepts.ilike(like), Paper.abstract.ilike(like)]
        for word in words:
            wlike = f"%{word}%"
            conditions.extend([Paper.title.ilike(wlike), Paper.concepts.ilike(wlike)])
        q = q.filter(or_(*conditions))
    return q.order_by(Paper.year.desc().nullslast()).limit(limit).all()


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    message = payload.message.strip()
    intent = _detect_intent(message)
    query = _extract_query(message)

    researchers: list[ResearcherProfile] = []
    papers: list[Paper] = []

    if intent in ("researchers", "both"):
        researchers = _search_researchers(db, query)
    if intent in ("papers", "both"):
        papers = _search_papers(db, query)

    parts = []
    if researchers:
        parts.append(f"I found {len(researchers)} researcher(s)")
    if papers:
        parts.append(f"I found {len(papers)} paper(s)")

    if parts:
        answer = " and ".join(parts) + (f" related to '{query}'." if query else ".")
    else:
        answer = (
            f"I couldn't find exact matches for '{query}'. Try a broader field like AI, NLP, "
            "machine learning, computer vision, or medical diagnosis."
            if query else
            "Ask me for researchers, papers, or both in a field. Example: 'Find researchers in NLP'."
        )

    return ChatResponse(
        answer=answer,
        intent=intent,
        query=query,
        researchers=[
            ChatResearcher(
                id=r.id,
                name=r.name,
                institution=r.institution or "Unknown",
                location=r.location or "Unknown",
                topics=r.topics or "",
                paper_count=r.paper_count or 0,
                is_claimed=bool(r.is_claimed),
            )
            for r in researchers
        ],
        papers=[
            ChatPaper(
                id=p.id,
                title=p.title,
                year=p.year,
                concepts=p.concepts or "",
                abstract=(p.abstract or "")[:240],
            )
            for p in papers
        ],
    )
