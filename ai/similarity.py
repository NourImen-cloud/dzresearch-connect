"""
Similarity Module: Computes researcher-to-researcher similarity scores
- Uses: Cosine similarity in embedding space (fast, effective)
- Input: High-dimensional embeddings from embedding.py
- Output: NxN similarity matrix where higher = more similar
- Use Case: Foundation for recommendations, network analysis, and ranking
"""

import numpy as np
import pandas as pd
import os
from sklearn.metrics.pairwise import cosine_similarity
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Path Helper ────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

def get_data_path(filename):
    return os.path.join(DATA_DIR, filename)

def compute_similarity_matrix():
    """Load embeddings and compute full similarity matrix"""
    
    logger.info(" Loading embeddings...")
    try:
        embeddings = np.load(get_data_path("embeddings.npy"))
        index = pd.read_csv(get_data_path("embedding_index.csv"))
    except FileNotFoundError as e:
        logger.error(f" Missing data files. Run embedding.py first - {e}")
        raise
    
    if len(embeddings) != len(index):
        raise ValueError(f"Mismatch: {len(embeddings)} embeddings vs {len(index)} index entries")
    
    logger.info(f"Loaded {len(index)} researcher embeddings")
    logger.info(f"Embedding dimension: {embeddings.shape[1]}")
    
    # Compute similarity matrix
    logger.info("  Computing cosine similarity matrix...")
    similarity_matrix = cosine_similarity(embeddings)
    
    logger.info(f"✓ Similarity matrix shape: {similarity_matrix.shape}")
    
    # Statistics
    # Zero out diagonal to exclude self-similarity
    np.fill_diagonal(similarity_matrix, 0)
    
    percentiles = np.percentile(similarity_matrix[similarity_matrix > 0], [25, 50, 75, 90])
    logger.info(f"Similarity score distribution (non-zero):")
    logger.info(f"  25th percentile: {percentiles[0]:.3f}")
    logger.info(f"  50th percentile: {percentiles[1]:.3f} (median)")
    logger.info(f"  75th percentile: {percentiles[2]:.3f}")
    logger.info(f"  90th percentile: {percentiles[3]:.3f}")
    
    # Save matrix
    logger.info(" Saving similarity matrix...")
    np.save(get_data_path("similarity_matrix.npy"), similarity_matrix)
    
    logger.info(" Success!")
    logger.info(f"   - {get_data_path('similarity_matrix.npy')}")
    
    return similarity_matrix, index

def get_similarity_score(name_a, name_b, index=None, similarity_matrix=None):
    """
    Query similarity between two researchers by name.
    Useful for testing and debugging.
    """
    if index is None:
        index = pd.read_csv(get_data_path("embedding_index.csv"))
    if similarity_matrix is None:
        similarity_matrix = np.load(get_data_path("similarity_matrix.npy"))
    
    try:
        # Case-insensitive search
        idx_a = index[index["name"].str.lower() == name_a.lower()].index[0]
        idx_b = index[index["name"].str.lower() == name_b.lower()].index[0]
        
        score = similarity_matrix[idx_a][idx_b]
        
        logger.info(f" Similarity: '{name_a}' <-> '{name_b}' = {score:.4f}")
        return score
    except IndexError:
        logger.warning(f" One or both researchers not found: {name_a}, {name_b}")
        return None

if __name__ == "__main__":
    compute_similarity_matrix()
    
    # Optional: Test with first two researchers
    index = pd.read_csv(get_data_path("embedding_index.csv"))
    if len(index) > 1:
        name_a = index.iloc[0]["name"]
        name_b = index.iloc[1]["name"]
        logger.info(f"\n Test Query:")
        get_similarity_score(name_a, name_b)