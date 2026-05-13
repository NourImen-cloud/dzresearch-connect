"""Build digest content from DB search heuristics (no external mail dependency)."""

from html import escape

from sqlalchemy.orm import Session

from app.db.models import Paper, ResearcherProfile
from app.schemas.digest import DigestPaperItem, DigestPreviewResponse, DigestResearcherItem


def _paper_query(db: Session, query: str, topic: str, limit: int = 10):
    q = db.query(Paper)
    needle = (topic if topic and topic != "All Topics" else query or "").strip()
    if needle:
        like = f"%{needle.lower()}%"
        q = q.filter(Paper.title.ilike(like) | Paper.concepts.ilike(like))
    else:
        like = "%computer%"
        q = q.filter(Paper.title.ilike(like) | Paper.concepts.ilike(like))
    return q.order_by(Paper.year.desc()).limit(limit).all()


def _researcher_query(db: Session, query: str, limit: int = 6):
    rq = db.query(ResearcherProfile)
    if query and query.strip():
        like = f"%{query.strip().lower()}%"
        rq = rq.filter(
            ResearcherProfile.name.ilike(like) | ResearcherProfile.topics.ilike(like)
        )
    return rq.order_by(ResearcherProfile.citations.desc()).limit(limit).all()


def build_digest_preview(
    db: Session,
    query: str,
    country: str,
    result_type: str,
    topic: str,
) -> DigestPreviewResponse:
    papers_orm = _paper_query(db, query, topic, limit=10)
    researchers_orm = _researcher_query(db, query, limit=6)

    papers = [
        DigestPaperItem(id=p.id, title=p.title or "Untitled", year=p.year) for p in papers_orm
    ]
    researchers = [
        DigestResearcherItem(id=r.id, name=r.name, institution=r.institution or "")
        for r in researchers_orm
    ]

    intro = (
        "Here are papers and researchers in the DZresearch catalog matching your saved filters. "
        f"Filters: query={query or '—'}, topic={topic or '—'}."
    )
    subject = "Your DZresearch digest"

    parts = [f"<p>{escape(intro)}</p>", "<h2>Papers</h2><ul>"]
    for p in papers:
        parts.append(
            f"<li>{escape(p.title)} ({p.year or 'n/a'}) — <code>{escape(p.id)}</code></li>"
        )
    parts.append("</ul><h2>Researchers</h2><ul>")
    for r in researchers:
        parts.append(f"<li>{escape(r.name)} — {escape(r.institution)}</li>")
    parts.append("</ul>")
    html = "".join(parts)

    return DigestPreviewResponse(
        subject=subject,
        intro=intro,
        papers=papers,
        researchers=researchers,
        html=html,
    )
