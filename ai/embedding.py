"""
Embedding Module: Creates semantic embeddings for researcher profiles
- Combines: researcher metadata + paper titles + abstracts
- Uses: Sentence Transformers (all-MiniLM-L6-v2)
- Output: Saved embeddings + searchable index
"""
import pandas as pd
import numpy as np
import os
import logging
import warnings

warnings.filterwarnings('ignore')

from sentence_transformers import SentenceTransformer

# ── Logging ────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Path Helper ────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

def get_data_path(filename):
    return os.path.join(DATA_DIR, filename)

# ── Configuration ──────────────────────────────────────────
MODEL_NAME = "all-MiniLM-L6-v2"
BATCH_SIZE = 32
MIN_ABSTRACT_LENGTH = 20
MAX_ABSTRACT_LENGTH = 500

RESEARCHERS_FILE = get_data_path("consolidated_researchers.csv")
AUTHOR_PAPERS_FILE = get_data_path("consolidated_author_papers.csv")




# ── Load Data ──────────────────────────────────────────────
def load_data():
    logger.info("Loading data files...")

    researchers_file = RESEARCHERS_FILE 
    papers_file = AUTHOR_PAPERS_FILE 

    try:
        researchers = pd.read_csv(researchers_file)
        author_papers = pd.read_csv(papers_file)

        logger.info(f"Loaded {len(researchers)} researchers")
        logger.info(f" Loaded {len(author_papers)} author-paper links")

        return researchers, author_papers

    except FileNotFoundError as e:
        logger.error(f"Data files not found: {e}")
        raise


# ── Normalize Data ─────────────────────────────────────────
def normalize_researcher_data(researchers):
    logger.info("Normalizing researcher data...")

    # Safe column handling
    if 'location_tag' not in researchers.columns:
        if 'location' in researchers.columns:
            researchers['location_tag'] = researchers['location']
        else:
            researchers['location_tag'] = 'unknown'

    researchers['location_tag'] = (
        researchers['location_tag']
        .fillna('unknown')
        .astype(str)
        .str.lower()
        .str.strip()
    )

    if 'institution' not in researchers.columns:
        researchers['institution'] = 'Unknown Institution'
    else:
        researchers['institution'] = researchers['institution'].fillna('Unknown Institution')

    if 'topics' not in researchers.columns:
        researchers['topics'] = 'AI Research'
    else:
        researchers['topics'] = researchers['topics'].fillna('AI Research')

    return researchers


# ── Build Profile Text ─────────────────────────────────────
def build_profile_text(row, author_papers):
    parts = []
    r_id = row.get("id")

    # Basic info
    if pd.notna(row.get("name")):
        parts.append(f"Name: {row['name']}")

    if pd.notna(row.get("institution")):
        parts.append(f"Institution: {row['institution']}")

    if pd.notna(row.get("topics")):
        parts.append(f"Topics: {row['topics']}")

    if pd.notna(row.get("h_index")):
        try:
            if float(row["h_index"]) > 0:
                parts.append(f"H-Index: {int(float(row['h_index']))}")
        except:
            pass

    # Ensure matching types for join
    if "author_id" in author_papers.columns:
        try:
            their_papers = author_papers[
                author_papers["author_id"].astype(str) == str(r_id)
            ]
        except:
            their_papers = pd.DataFrame()
    else:
        their_papers = pd.DataFrame()

    # Add papers
    if not their_papers.empty:
        if "year" in their_papers.columns:
            their_papers = their_papers.sort_values("year", ascending=False)

        their_papers = their_papers.head(3)

        for _, paper in their_papers.iterrows():
            if pd.notna(paper.get("title")):
                parts.append(f"Paper: {paper['title']}")

            abstract = str(paper.get("abstract", ""))

            if (
                pd.notna(paper.get("abstract")) and
                len(abstract) > MIN_ABSTRACT_LENGTH and
                "nan" not in abstract.lower()
            ):
                parts.append(f"Abstract: {abstract[:MAX_ABSTRACT_LENGTH]}")

    profile_text = " | ".join(parts)

    # Ensure minimum content
    if len(profile_text.split()) < 5:
        profile_text += f" | Research in {row.get('topics', 'AI')}"

    return profile_text


# ── Main Pipeline ──────────────────────────────────────────
def generate_embeddings():
    logger.info(" Starting embedding pipeline...")

    researchers, author_papers = load_data()
    researchers = normalize_researcher_data(researchers)

    # Debug columns
    logger.info(f"Columns in researchers: {list(researchers.columns)}")
    logger.info(f"Columns in author_papers: {list(author_papers.columns)}")

    # Build profiles
    logger.info(" Building researcher profiles...")
    researchers["profile_text"] = researchers.apply(
        lambda row: build_profile_text(row, author_papers),
        axis=1
    )

    avg_len = researchers["profile_text"].str.split().str.len().mean()
    logger.info(f" Avg profile length: {avg_len:.0f} words")

    # Load model
    logger.info(f" Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    # Generate embeddings
    logger.info(f" Embedding {len(researchers)} profiles...")
    embeddings = model.encode(
        researchers["profile_text"].tolist(),
        batch_size=BATCH_SIZE,
        show_progress_bar=True
    )

    logger.info(f"Embedding shape: {embeddings.shape}")

    # Save results
    os.makedirs(DATA_DIR, exist_ok=True)

    np.save(get_data_path("embeddings.npy"), embeddings)

    researchers[["id", "name", "location_tag"]].to_csv(
        get_data_path("embedding_index.csv"),
        index=False
    )

    logger.info(" Done!")
    logger.info("Saved:")
    logger.info(f" - {get_data_path('embeddings.npy')}")
    logger.info(f" - {get_data_path('embedding_index.csv')}")

    return embeddings, researchers


# ── Entry Point ────────────────────────────────────────────
if __name__ == "__main__":
    try:
        generate_embeddings()
    except Exception as e:
        logger.error(f" Pipeline failed: {e}")
        import traceback
        traceback.print_exc()