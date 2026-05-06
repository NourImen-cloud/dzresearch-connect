"""
Pipeline Module: Orchestrate the complete AI workflow
- Step 1: Generate embeddings
- Step 2: Compute similarity
- Step 3: Build network
- Provides unified interface for all AI operations
"""

import logging
import sys
import os
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

import embedding
import similarity
import network_analysis
import recommender
from config import *

logging.basicConfig(
    level=LOG_LEVEL,
    format=LOG_FORMAT
)
logger = logging.getLogger(__name__)

def print_header(title):
    """Print formatted header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70 + "\n")

def run_full_pipeline():
    """
    Execute the complete AI pipeline:
    1. Generate embeddings from researcher profiles
    2. Compute similarity matrix
    3. Build network visualization
    """
    print_header("🚀 DZ Research Connect - AI Pipeline")
    logger.info(f"Started at {datetime.now()}")
    
    try:
        # Step 1: Generate Embeddings
        print_header("STEP 1: Generating Embeddings")
        logger.info(f"Configuration:")
        logger.info(f"  Model: {EMBEDDING_MODEL}")
        logger.info(f"  Batch size: {EMBEDDING_BATCH_SIZE}")
        logger.info(f"  Output dimension: {EMBEDDING_DIMENSION}")
        
        embeddings, researchers = embedding.generate_embeddings()
        logger.info(" Embeddings generated successfully")
        
        # Step 2: Compute Similarity
        print_header("STEP 2: Computing Similarity Matrix")
        logger.info(f"Configuration:")
        logger.info(f"  Metric: {SIMILARITY_METRIC}")
        logger.info(f"  Min score threshold: {SIMILARITY_MIN_SCORE}")
        
        sim_matrix, index = similarity.compute_similarity_matrix()
        logger.info(" Similarity matrix computed successfully")
        
        # Step 3: Build Network
        print_header("STEP 3: Building Network Visualization")
        logger.info(f"Configuration:")
        logger.info(f"  Threshold: {NETWORK_SIMILARITY_THRESHOLD}")
        
        graph, net = network_analysis.create_network_visualization( threshold=NETWORK_SIMILARITY_THRESHOLD)
        logger.info(" Network visualization created successfully")
        
        # Summary
        print_header(" Pipeline Complete")
        logger.info(f"Summary:")
        logger.info(f"  Researchers processed: {len(researchers)}")
        logger.info(f"  Embeddings generated: {embeddings.shape[0]}")
        logger.info(f"  Similarity matrix: {sim_matrix.shape}")
        logger.info(f"  Network nodes: {len(graph.nodes)}")
        logger.info(f"  Network edges: {len(graph.edges)}")
        logger.info(f"\nOutput files:")
        logger.info(f"  ✓ {EMBEDDINGS_FILE}")
        logger.info(f"  ✓ {SIMILARITY_MATRIX_FILE}")
        logger.info(f"  ✓ {EMBEDDING_INDEX_FILE}")
        logger.info(f"  ✓ {NETWORK_OUTPUT_FILE}")
        logger.info(f"\nNext steps:")
        logger.info(f"  1. Start the API: python api.py")
        logger.info(f"  2. Access the dashboard at http://localhost:8000")
        logger.info(f"  3. Open network visualization: {NETWORK_OUTPUT_FILE}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_system():
    """Quick validation that all components work"""
    print_header("🧪 System Validation")
    
    try:
        # Test 1: Check files exist
        logger.info("Checking output files...")
        files_ok = True
        for f in [EMBEDDINGS_FILE, SIMILARITY_MATRIX_FILE, EMBEDDING_INDEX_FILE]:
            exists = os.path.exists(f)
            logger.info(f"  {'✓' if exists else '✗'} {f}")
            files_ok = files_ok and exists
        
        if not files_ok:
            logger.warning("⚠️  Some output files missing. Run full pipeline first.")
            return
        
        # Test 2: Test recommender
        logger.info("\nTesting recommender system...")
        result = recommender.recommend_collaborators(
            recommender._load_all()[3].iloc[0]["id"],
            top_n=3
        )
        logger.info(f"  Found {result.get('count', 0)} collaborators")
        
        # Test 3: Test search
        logger.info("\nTesting semantic search...")
        result = recommender.query_researchers("machine learning", top_n=3)
        logger.info(f"  Found {result.get('count', 0)} researchers")
        
        logger.info("\n✅ System validation passed!")
        
    except Exception as e:
        logger.error(f"❌ Validation failed: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="AI Pipeline for DZ Research Connect")
    parser.add_argument("--run", action="store_true", help="Run full pipeline")
    parser.add_argument("--test", action="store_true", help="Test system")
    parser.add_argument("--all", action="store_true", help="Run full pipeline + test")
    
    args = parser.parse_args()
    
    if args.run or args.all:
        run_full_pipeline()
    
    if args.test or args.all:
        test_system()
    
    if not any([args.run, args.test, args.all]):
        print("Usage:")
        print("  python pipeline.py --run    # Run full pipeline")
        print("  python pipeline.py --test   # Test system")
        print("  python pipeline.py --all    # Run both")
