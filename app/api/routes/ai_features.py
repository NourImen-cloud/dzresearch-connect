"""AI-powered endpoints: recommendations, search, and network data."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
import numpy as np
import pandas as pd

from app.core.config import EMBEDDING_INDEX_FILE, SIMILARITY_MATRIX_FILE
from ai import recommender


router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/recommendations/{researcher_id}")
def get_recommendations(
    researcher_id: str,
    top_n: int = Query(default=10, ge=1, le=50),
    min_score: float = Query(default=0.3, ge=0.0, le=1.0),
):
    result = recommender.recommend_collaborators(researcher_id, top_n=top_n, min_score=min_score)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return {"success": True, "data": result}


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

    nodes = []
    for i, row in index.iterrows():
        nodes.append({"id": int(i), "researcher_id": str(row["id"]), "label": row["name"]})

    edges = []
    for i in range(similarity.shape[0]):
        for j in range(i + 1, similarity.shape[0]):
            score = float(similarity[i][j])
            if score >= threshold:
                edges.append({"source": i, "target": j, "weight": round(score, 4)})

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
