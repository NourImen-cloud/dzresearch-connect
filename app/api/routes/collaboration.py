"""Co-authorship collaboration graph (shared papers)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, aliased

from app.db.models import ResearcherPaper, ResearcherProfile
from app.db.session import get_db
from app.schemas.collaboration import CollabEdge, CollabEgoResponse, CollabNode

router = APIRouter(prefix="/collaboration", tags=["Collaboration"])


def _display_location(profile: ResearcherProfile) -> str:
    loc = (profile.location or "").strip()
    if (profile.country or "").upper() == "DZ" or "algeria" in loc.lower():
        return "Algeria"
    return loc.title() if loc else "Unknown"


@router.get("/ego/{researcher_id:path}", response_model=CollabEgoResponse)
def collaboration_ego_graph(
    researcher_id: str,
    limit_neighbors: int = Query(default=40, ge=1, le=120),
    db: Session = Depends(get_db),
):
    center = db.query(ResearcherProfile).filter(ResearcherProfile.id == researcher_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Researcher not found")

    rp1 = aliased(ResearcherPaper)
    rp2 = aliased(ResearcherPaper)
    rows = (
        db.query(rp2.researcher_id, func.count().label("shared"))
        .select_from(rp1)
        .join(
            rp2,
            (rp1.paper_id == rp2.paper_id) & (rp2.researcher_id != rp1.researcher_id),
        )
        .filter(rp1.researcher_id == researcher_id)
        .group_by(rp2.researcher_id)
        .order_by(func.count().desc())
        .limit(limit_neighbors)
        .all()
    )

    neighbor_ids = [r[0] for r in rows]
    profiles = (
        db.query(ResearcherProfile)
        .filter(ResearcherProfile.id.in_([researcher_id] + neighbor_ids))
        .all()
    )
    by_id = {p.id: p for p in profiles}

    nodes: list[CollabNode] = []
    edges: list[CollabEdge] = []

    ego = by_id.get(researcher_id)
    if ego:
        nodes.append(
            CollabNode(
                id=ego.id,
                label=ego.name,
                location=_display_location(ego),
                papers=ego.paper_count or 0,
            )
        )

    for rid, shared in rows:
        p = by_id.get(rid)
        if not p:
            continue
        nodes.append(
            CollabNode(
                id=p.id,
                label=p.name,
                location=_display_location(p),
                papers=p.paper_count or 0,
            )
        )
        edges.append(
            CollabEdge(source=researcher_id, target=rid, weight=int(shared)),
        )

    return CollabEgoResponse(center_id=researcher_id, nodes=nodes, edges=edges)
