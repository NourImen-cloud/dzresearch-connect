"""Paper listing endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.models import Paper, ResearcherPaper
from app.db.session import get_db
from app.schemas.paper import PaperResponse


router = APIRouter(tags=["Papers"])


@router.get("/papers", response_model=List[PaperResponse])
def list_papers(
    topic: Optional[str] = Query(default=None),
    year: Optional[int] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Paper)
    if topic:
        like = f"%{topic.lower()}%"
        query = query.filter(Paper.title.ilike(like) | Paper.concepts.ilike(like))
    if year is not None:
        query = query.filter(Paper.year == year)
    return query.limit(limit).all()


@router.get("/papers/{paper_id:path}", response_model=PaperResponse)
def get_paper(paper_id: str, db: Session = Depends(get_db)):
    """Fetch a single paper by its ID."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@router.get("/researchers/{researcher_id:path}/papers", response_model=List[PaperResponse])
def get_researcher_papers(
    researcher_id: str,
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    paper_ids = (
        db.query(ResearcherPaper.paper_id)
        .filter(ResearcherPaper.researcher_id == researcher_id)
        .limit(limit)
        .all()
    )
    if not paper_ids:
        return []
    ids = [pid[0] for pid in paper_ids]
    return db.query(Paper).filter(Paper.id.in_(ids)).all()
