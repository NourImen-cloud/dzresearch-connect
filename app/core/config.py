"""Central configuration for the new backend app."""

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"

DATABASE_URL = f"sqlite:///{BASE_DIR / 'dzresearch.db'}"
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24

DIGEST_CRON_SECRET = os.getenv("DIGEST_CRON_SECRET", "")

RESEARCHERS_CSV = DATA_DIR / "consolidated_researchers.csv"
AUTHOR_PAPERS_CSV = DATA_DIR / "consolidated_author_papers.csv"
SIMILARITY_MATRIX_FILE = DATA_DIR / "similarity_matrix.npy"
EMBEDDING_INDEX_FILE = DATA_DIR / "embedding_index.csv"
