"""Bootstrap database from consolidated CSV files."""

from datetime import datetime

import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import AUTHOR_PAPERS_CSV, RESEARCHERS_CSV
from app.db.models import Paper, ResearcherPaper, ResearcherProfile


def _to_int(value, default=0):
    try:
        if pd.isna(value):
            return default
        return int(float(value))
    except (ValueError, TypeError):
        return default


def seed_database(db: Session) -> None:
    if db.query(ResearcherProfile).count() == 0 and RESEARCHERS_CSV.exists():
        researchers_df = pd.read_csv(RESEARCHERS_CSV)
        for _, row in researchers_df.iterrows():
            profile = ResearcherProfile(
                id=str(row.get("id", "")),
                name=str(row.get("name", "Unknown")),
                location=str(row.get("location", "unknown")),
                institution=str(row.get("institution", "Unknown")),
                country=str(row.get("country", "")),
                h_index=_to_int(row.get("h_index")),
                citations=_to_int(row.get("citations")),
                paper_count=_to_int(row.get("paper_count")),
                topics=str(row.get("topics", "")),
                bio="",
                specialty=str(row.get("topics", "")).split("|")[0].strip()[:300],
                website="",
                orcid="",
                is_claimed=False,
                claimed_by_user_id=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(profile)
        db.commit()

    if db.query(Paper).count() == 0 and AUTHOR_PAPERS_CSV.exists():
        author_papers_df = pd.read_csv(AUTHOR_PAPERS_CSV)
        seen_pairs = set()
        seen_papers = set()
        for _, row in author_papers_df.iterrows():
            researcher_id = str(row.get("author_id", ""))
            paper_id = str(row.get("paper_id", ""))
            if not researcher_id or not paper_id:
                continue

            if paper_id not in seen_papers:
                seen_papers.add(paper_id)
                paper = Paper(
                    id=paper_id,
                    title=str(row.get("title", ""))[:5000],
                    abstract=str(row.get("abstract", ""))[:15000],
                    year=_to_int(row.get("year"), default=None),
                    concepts=str(row.get("concepts", ""))[:5000],
                )
                db.add(paper)

            pair = (researcher_id, paper_id)
            if pair not in seen_pairs:
                seen_pairs.add(pair)
                db.add(ResearcherPaper(researcher_id=researcher_id, paper_id=paper_id))

        db.commit()
