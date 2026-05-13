"""AI-powered endpoints: recommendations, search, and network data."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
import numpy as np
import pandas as pd

from app.core.config import EMBEDDING_INDEX_FILE, RESEARCHERS_CSV, SIMILARITY_MATRIX_FILE
from ai import recommender


router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/recommendations/{researcher_id:path}")
def get_recommendations(
    researcher_id: str,
    top_n: int = Query(default=10, ge=1, le=50),
    min_score: float = Query(default=0.3, ge=0.0, le=1.0),
):
    """Returns empty results instead of 404 when the researcher is not in the AI index."""
    result = recommender.recommend_collaborators(researcher_id, top_n=top_n, min_score=min_score)
    if "error" in result:
        return {
            "success": True,
            "data": {
                "researcher": None,
                "count": 0,
                "results": [],
                "unavailable_reason": result.get("error", "Unknown"),
            },
        }
    return {"success": True, "data": result}


@router.get("/similarity-pair")
def similarity_pair(
    a: str = Query(..., description="First researcher id (e.g. OpenAlex URL)"),
    b: str = Query(..., description="Second researcher id"),
):
    out = recommender.similarity_between_ids(a, b)
    if not out.get("ok"):
        raise HTTPException(status_code=404, detail=out.get("message", "Could not compute similarity"))
    return {"success": True, "data": out}


@router.get("/search")
def smart_search(
    query: str,
    top_n: int = Query(default=10, ge=1, le=50),
    location: Optional[str] = Query(default=None),
):
    parsed_location = location.lower() if location else None
    if parsed_location in ("algeria", "dz"):
        parsed_location = "local"
    result = recommender.query_researchers(query, top_n=top_n, location_filter=parsed_location)
    return {"success": True, "data": result}


@router.get("/network")
def network_data(threshold: float = Query(default=0.6, ge=0.0, le=1.0)):
    if not SIMILARITY_MATRIX_FILE.exists() or not EMBEDDING_INDEX_FILE.exists():
        raise HTTPException(status_code=404, detail="Similarity artifacts not found. Run AI pipeline.")

    similarity = np.load(SIMILARITY_MATRIX_FILE)
    index = pd.read_csv(EMBEDDING_INDEX_FILE)
    index["id"] = index["id"].astype(str).str.strip()

    topics_by_id: dict[str, str] = {}
    paper_count_by_id: dict[str, int] = {}
    if RESEARCHERS_CSV.exists():
        rdf = pd.read_csv(RESEARCHERS_CSV)
        rdf["id"] = rdf["id"].astype(str).str.strip()
        for _, row in rdf.iterrows():
            rid = str(row["id"])
            topics_by_id[rid] = str(row.get("topics", "") or "")
            try:
                paper_count_by_id[rid] = int(float(row.get("paper_count", 0) or 0))
            except (TypeError, ValueError):
                paper_count_by_id[rid] = 0

    nodes = []
    for _, row in index.iterrows():
        rid = str(row["id"])
        loc_raw = str(row.get("location_tag", "") or "").strip().lower()
        loc_display = "Algeria" if loc_raw in ("local", "algeria", "dz") else (
            "Abroad" if loc_raw in ("diaspora", "abroad") else (loc_raw.title() if loc_raw else "Unknown")
        )
        nodes.append(
            {
                "id": rid,
                "label": str(row["name"]),
                "topics": topics_by_id.get(rid, ""),
                "paper_count": paper_count_by_id.get(rid, 0),
                "location": loc_display,
            }
        )

    id_list = index["id"].tolist()

    edges = []
    for i in range(similarity.shape[0]):
        for j in range(i + 1, similarity.shape[0]):
            score = float(similarity[i][j])
            if score >= threshold:
                edges.append(
                    {
                        "source": id_list[i],
                        "target": id_list[j],
                        "weight": round(score, 4),
                    }
                )

    return {
        "success": True,
        "data": {
            "threshold": threshold,
            "node_count": len(nodes),
            "edge_count": len(edges),
            "nodes": nodes,
            "edges": edges,
        },
    }
