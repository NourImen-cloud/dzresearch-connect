"""
Recommender System Module: Suggest collaborators based on researcher similarity
- Content-based filtering using research profile similarity
- Two main functions:
  1. recommend_collaborators: Find similar researchers to a target researcher
  2. query_researchers: Find researchers matching a text query (semantic search)
"""

import pandas as pd
import numpy as np
import logging
import os
import warnings
warnings.filterwarnings('ignore')

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError as e:
    print(f"Installing missing packages: {e}")
    import subprocess
    subprocess.check_call(['pip', 'install', 'sentence-transformers', 'scikit-learn'])
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Path Helper ────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

def get_data_path(filename):
    return os.path.join(DATA_DIR, filename)

# Data file paths with fallbacks
RESEARCHERS_FILE = get_data_path("consolidated_researchers.csv")
RESEARCHERS_FILE_ALT = get_data_path("researchers_enriched.csv")

# ── Global cache to avoid reloading ─────────────────────────────
_cache = {
    "researchers": None,
    "embeddings": None,
    "similarity_matrix": None,
    "index": None,
    "model": None
}

def _load_all():
    """Load all data with caching"""
    global _cache
    
    if _cache["researchers"] is None:
        logger.info(" Loading data (first time only)...")
        
        # Use consolidated if exists, else fallback
        researchers_file = RESEARCHERS_FILE if os.path.exists(RESEARCHERS_FILE) else RESEARCHERS_FILE_ALT
        
        try:
            _cache["researchers"] = pd.read_csv(researchers_file)
            _cache["embeddings"] = np.load(get_data_path("embeddings.npy"))
            _cache["similarity_matrix"] = np.load(get_data_path("similarity_matrix.npy"))
            _cache["index"] = pd.read_csv(get_data_path("embedding_index.csv"))
            _cache["model"] = SentenceTransformer("all-MiniLM-L6-v2")
            
            logger.info(f"✓ Loaded from {researchers_file}")
        except FileNotFoundError as e:
            logger.error(f"Error loading data: {e}")
            raise
        
        # Normalize location field
        researchers = _cache["researchers"]
        if 'location_tag' not in researchers.columns:
            researchers['location_tag'] = researchers['location'].fillna('unknown').str.lower().str.strip()
        if 'affiliations' not in researchers.columns:
            researchers['affiliations'] = researchers['institution'].fillna('Unknown')
    
    return (_cache["researchers"], _cache["embeddings"], 
            _cache["similarity_matrix"], _cache["index"], _cache["model"])

def recommend_collaborators(researcher_id, top_n=10, min_score=0.3):
    """
    Recommend collaborators for a researcher
    
    Args:
        researcher_id: ID of target researcher (string or int)
        top_n: Number of recommendations (default: 10)
        min_score: Minimum similarity score threshold (default: 0.3)
    
    Returns:
        List of dicts with: id, name, affiliation, location_tag, score
    """
    researchers, embeddings, similarity_matrix, index, model = _load_all()
    
    # Find researcher in index (handle string/int mismatch)
    researcher_id_str = str(researcher_id)
    matches = index[index["id"] == researcher_id_str]
    
    if matches.empty:
        logger.warning(f"Researcher {researcher_id} not found")
        return {"error": f"Researcher {researcher_id} not found", "results": []}
    
    row_idx = matches.index[0]
    rec_name = matches.iloc[0]["name"]
    
    # Get similarity scores
    scores = similarity_matrix[row_idx].copy()
    scores[row_idx] = -1  # Exclude self
    
    sorted_indices = np.argsort(scores)[::-1]
    
    recommendations = []
    for idx in sorted_indices:
        score = scores[idx]
        
        if score < min_score:
            break
        
        rec_id = index.iloc[idx]["id"]
        rec_info = researchers[researchers["id"] == rec_id]
        
        if rec_info.empty:
            continue
        
        rec = rec_info.iloc[0]
        
        affil = str(rec.get("affiliations", rec.get("institution", "Unknown")))
        if "|" in affil:
            affil = affil.split("|")[0]
        affil = affil[:50]
        
        loc = str(rec.get("location_tag", rec.get("location", "unknown"))).lower().title()
        
        recommendations.append({
            "id": str(rec_id),
            "name": rec["name"],
            "affiliation": affil,
            "location": loc,
            "h_index": int(rec.get("h_index", 0)),
            "topics": rec.get("topics", ""),
            "score": round(float(score), 4)
        })
        
        if len(recommendations) >= top_n:
            break
    
    logger.info(f"Found {len(recommendations)} collaborators for {rec_name}")
    
    return {
        "researcher": rec_name,
        "count": len(recommendations),
        "results": recommendations
    }

def query_researchers(query_text, top_n=10, location_filter=None):
    """
    Find researchers matching a text query (semantic search)
    
    Args:
        query_text: Search query (e.g., "AI in healthcare")
        top_n: Number of results (default: 10)
        location_filter: Filter by location (e.g., "local", "diaspora")
    
    Returns:
        List of dicts with researcher info and relevance scores
    """
    researchers, embeddings, similarity_matrix, index, model = _load_all()
    
    # Encode query
    logger.info(f"🔍 Query: {query_text}")
    query_vector = model.encode([query_text], show_progress_bar=False)
    
    # Compute similarity to all researchers
    scores = cosine_similarity(query_vector, embeddings)[0]
    sorted_indices = np.argsort(scores)[::-1]
    
    results = []
    for idx in sorted_indices:
        rec_id = index.iloc[idx]["id"]
        rec_info = researchers[researchers["id"] == rec_id]
        
        if rec_info.empty:
            continue
        
        rec = rec_info.iloc[0]
        
        # Apply location filter if specified
        loc = str(rec.get("location_tag", rec.get("location", "unknown"))).lower()
        if location_filter and loc != location_filter.lower():
            continue
        
        affil = str(rec.get("affiliations", rec.get("institution", "Unknown")))
        if "|" in affil:
            affil = affil.split("|")[0]
        affil = affil[:50]
        
        results.append({
            "id": str(rec_id),
            "name": rec["name"],
            "affiliation": affil,
            "location": loc.title(),
            "topics": rec.get("topics", ""),
            "h_index": int(rec.get("h_index", 0)),
            "relevance_score": round(float(scores[idx]), 4)
        })
        
        if len(results) >= top_n:
            break
    
    logger.info(f"Found {len(results)} researchers matching query")
    
    return {
        "query": query_text,
        "count": len(results),
        "results": results
    }

def search_by_topic(topic, top_n=10, location_filter=None):
    """
    Find researchers by research topic
    
    Args:
        topic: Research topic (e.g., "machine learning", "climate change")
        top_n: Number of results
        location_filter: Filter by location
    
    Returns:
        Researchers matching the topic
    """
    return query_researchers(topic, top_n=top_n, location_filter=location_filter)

# ── Example Usage ───────────────────────────────────────────────
if __name__ == "__main__":
    # Test 1: Get recommendations for first researcher
    logger.info("\n" + "="*60)
    logger.info("TEST 1: Collaborator Recommendations")
    logger.info("="*60)
    
    index = pd.read_csv("data/embedding_index.csv")
    if len(index) > 0:
        test_id = index.iloc[0]["id"]
        result = recommend_collaborators(test_id, top_n=5)
        for rec in result.get("results", [])[:3]:
            logger.info(f"  {rec['name']:30s} ({rec['score']:.3f}) - {rec['affiliation']}")
    
    # Test 2: Query by topic
    logger.info("\n" + "="*60)
    logger.info("TEST 2: Topic Search")
    logger.info("="*60)
    
    result = query_researchers("machine learning artificial intelligence", top_n=5)
    for rec in result.get("results", [])[:3]:
        logger.info(f"  {rec['name']:30s} ({rec['relevance_score']:.3f}) - {rec['topics'][:40]}")
    
    # Test 3: Query with location filter
    logger.info("\n" + "="*60)
    logger.info("TEST 3: Diaspora Search")
    logger.info("="*60)
    
    result = query_researchers("AI deep learning", top_n=5, location_filter="diaspora")
    logger.info(f"Found {result['count']} researchers in diaspora working on: {result['query']}")