"""
Configuration Module: Central configuration for AI pipeline
- Embedding model selection
- Similarity thresholds
- Recommendation parameters
- File paths
"""

import os

# ── Path Helper ────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

def get_data_path(filename):
    return os.path.join(DATA_DIR, filename)


CONSOLIDATED_RESEARCHERS_FILE = "data/consolidated_researchers.csv"
CONSOLIDATED_PAPERS_FILE = "data/consolidated_papers.csv"
CONSOLIDATED_AUTHOR_PAPERS_FILE = "data/consolidated_author_papers.csv"


ORIGINAL_RESEARCHERS_FILE = "data/researchers_enriched.csv"
ORIGINAL_AUTHOR_PAPERS_FILE = "data/author_papers_linked.csv"


def get_researchers_file():
    """Get the best available researchers file"""
    if os.path.exists(CONSOLIDATED_RESEARCHERS_FILE):
        return CONSOLIDATED_RESEARCHERS_FILE
    return ORIGINAL_RESEARCHERS_FILE

def get_author_papers_file():
    """Get the best available author-papers file"""
    if os.path.exists(CONSOLIDATED_AUTHOR_PAPERS_FILE):
        return CONSOLIDATED_AUTHOR_PAPERS_FILE
    return ORIGINAL_AUTHOR_PAPERS_FILE


EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Fast, efficient, good for research
EMBEDDING_BATCH_SIZE = 32
EMBEDDING_DIMENSION = 384  # Output dimension of all-MiniLM-L6-v2



# ── Profile Building Configuration ────────────────────────────────
MIN_ABSTRACT_LENGTH = 20   # Minimum characters for abstract to be included
MAX_ABSTRACT_LENGTH = 500  # Truncate abstracts to this length
NUM_PAPERS_PER_RESEARCHER = 3  # Include top N papers in profile

# ── Similarity & Recommendation Configuration ────────────────────
SIMILARITY_METRIC = "cosine"  # Cosine similarity in embedding space
SIMILARITY_MIN_SCORE = 0.3    # Minimum similarity threshold for recommendations
RECOMMENDATION_TOP_N = 10     # Default number of recommendations

# ── Network Analysis Configuration ────────────────────────────────
NETWORK_SIMILARITY_THRESHOLD = 0.60  # Threshold for creating network edges
NETWORK_EDGE_MIN_WEIGHT = 0.55

# ── Query Configuration ───────────────────────────────────────────
QUERY_TOP_N = 10
QUERY_SIMILARITY_MIN = 0.2

# ── Data Paths ───────────────────────────────────────────────────
EMBEDDINGS_FILE = get_data_path("embeddings.npy")
SIMILARITY_MATRIX_FILE = get_data_path("similarity_matrix.npy")
EMBEDDING_INDEX_FILE = get_data_path("embedding_index.csv")
RESEARCHERS_FILE = get_data_path("researchers_enriched.csv")
AUTHOR_PAPERS_FILE = get_data_path("author_papers_linked.csv")
NETWORK_OUTPUT_FILE = get_data_path("research_network.html")

# ── Location Categories ──────────────────────────────────────────
LOCATION_DIASPORA = ["diaspora", "abroad", "international"]
LOCATION_LOCAL = ["algeria", "local", "dz", "algerian"]
LOCATION_UNKNOWN = ["unknown", "not specified"]

# ── Research Domain ──────────────────────────────────────────────

PRIMARY_DOMAIN = "Artificial Intelligence"
RELEVANT_TOPICS = [
    "artificial intelligence",
    "machine learning",
    "deep learning",
    "computer science",
    "natural language processing",
    "computer vision",
    "neural networks",
    "data science"
]

# ── Logging Configuration ────────────────────────────────────────
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
