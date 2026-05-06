"""
Network Analysis Module: Visualize researcher collaboration networks
- Graph construction using NetworkX
- Nodes: Researchers (colored by location)
- Edges: Similarity connections (weighted)
- Output: Interactive HTML visualization via Pyvis
- Insights: Centrality, clustering, communities
"""

import numpy as np
import pandas as pd
import os
import logging
import warnings
warnings.filterwarnings('ignore')

try:
    import networkx as nx
    from pyvis.network import Network
except ImportError as e:
    print(f"Installing missing packages: {e}")
    import subprocess
    subprocess.check_call(['pip', 'install', 'networkx', 'pyvis'])
    import networkx as nx
    from pyvis.network import Network

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

# ── Configuration ────────────────────────────────────────────────
SIMILARITY_THRESHOLD = 0.6
NODE_SIZE_MIN = 10
NODE_SIZE_MAX = 40
OUTPUT_FILENAME = get_data_path("research_network.html")

def load_network_data():
    """Load similarity matrix, embeddings index, and researcher data"""
    logger.info(" Loading network data...")
    
    # Use consolidated if exists, else fallback
    researchers_file = RESEARCHERS_FILE if os.path.exists(RESEARCHERS_FILE) else RESEARCHERS_FILE_ALT
    
    try:
        similarity_matrix = np.load(get_data_path("similarity_matrix.npy"))
        index = pd.read_csv(get_data_path("embedding_index.csv"))
        researchers = pd.read_csv(researchers_file)
        
        logger.info(f"✓ Loaded {len(index)} researchers from {researchers_file}")
        return similarity_matrix, index, researchers
    except FileNotFoundError as e:
        logger.error(f"Missing files. Run embedding.py and similarity.py first - {e}")
        raise

def normalize_location(loc_str):
    """Standardize location field"""
    loc = str(loc_str).lower().strip()
    if loc in ["diaspora", "abroad"]:
        return "diaspora"
    elif loc in ["algeria", "local", "dz"]:
        return "local"
    return "unknown"

def get_node_color(location):
    """Assign colors based on location"""
    colors = {
        "diaspora": "#ff79c6",   # Pink/Purple - Diaspora
        "local": "#8be9fd",       # Cyan - Local
        "unknown": "#6272a4"      # Blue-gray - Unknown
    }
    return colors.get(location, "#6272a4")

def compute_network_stats(G):
    """Compute and log network statistics"""
    logger.info("\n Network Statistics:")
    logger.info(f"  Nodes: {len(G.nodes)}")
    logger.info(f"  Edges: {len(G.edges)}")
    
    if len(G.nodes) > 0:
        density = nx.density(G)
        logger.info(f"  Density: {density:.4f}")
        
        # Components
        num_components = nx.number_connected_components(G)
        logger.info(f"  Connected components: {num_components}")
        
        # Largest component
        if num_components > 0:
            largest_cc = max(nx.connected_components(G), key=len)
            logger.info(f"  Largest component size: {len(largest_cc)}")
        
        # Centrality
        degrees = dict(G.degree())
        top_degree_nodes = sorted(degrees.items(), key=lambda x: x[1], reverse=True)[:5]
        logger.info(f"  Core researchers (by connections):")
        for node_id, degree in top_degree_nodes:
            try:
                node_name = index.iloc[node_id]["name"]
                logger.info(f"    - {node_name}: {degree} connections")
            except:
                pass

def create_network_visualization(threshold=SIMILARITY_THRESHOLD):
    """
    Create interactive network visualization
    
    Args:
        threshold: Minimum similarity score for edges (default: 0.6)
    """
    logger.info("Building researcher network visualization...")
    
    # Load data
    similarity_matrix, index, researchers = load_network_data()
    
    logger.info(f"Building graph (threshold={threshold})...")
    G = nx.Graph()
    
    # Add nodes
    logger.info("  Adding nodes...")
    num_nodes = 0
    for idx, row in index.iterrows():
        r_id = row["id"]
        name = row["name"]
        
        # Get researcher info
        rec_info = researchers[researchers["id"] == str(r_id)]
        if not rec_info.empty:
            loc = normalize_location(rec_info.iloc[0].get("location_tag", rec_info.iloc[0].get("location", "unknown")))
            affil = str(rec_info.iloc[0].get("institution", "Unknown")).split("|")[0][:50]
        else:
            loc = "unknown"
            affil = "Unknown"
        
        color = get_node_color(loc)
        title_tooltip = f"<b>{name}</b><br>Affiliation: {affil}<br>Location: {loc.title()}"
        
        G.add_node(idx, label=name, title=title_tooltip, color=color, location=loc)
        num_nodes += 1
    
    logger.info(f"  ✓ Added {num_nodes} nodes")
    
    # Add edges (only between similar researchers)
    logger.info("  Adding edges...")
    num_edges = 0
    num_researchers = similarity_matrix.shape[0]
    
    for i in range(num_researchers):
        for j in range(i + 1, num_researchers):
            score = float(similarity_matrix[i][j])
            if score >= threshold:
                G.add_edge(i, j, weight=score, value=score, 
                          title=f"Research Similarity: {score:.3f}")
                num_edges += 1
    
    logger.info(f"  ✓ Added {num_edges} edges")
    
    if num_edges == 0:
        logger.warning(f" No edges found with threshold {threshold}")
        logger.info(f"     Try lowering the threshold (current: {threshold})")
        return
    
    # Compute and display stats
    compute_network_stats(G)
    
    # Size nodes by degree centrality
    logger.info("\nComputing node sizes (by connectivity)...")
    degree_dict = dict(G.degree(G.nodes()))
    max_degree = max(degree_dict.values()) if degree_dict.values() else 1
    
    sizes = {}
    for node, degree in degree_dict.items():
        sizes[node] = NODE_SIZE_MIN + (degree / max_degree) * (NODE_SIZE_MAX - NODE_SIZE_MIN)
    
    nx.set_node_attributes(G, sizes, 'size')
    
    # Create Pyvis visualization
    logger.info(" Rendering interactive network...")
    net = Network(
        height='900px', 
        width='100%', 
        bgcolor='#282a36',      # Dark background
        font_color='#f8f8f2',   # Light text
        select_menu=True, 
        filter_menu=True
    )
    
    # Physics simulation for nice layout
    net.force_atlas_2based(
        central_gravity=0.015,
        spring_length=150,
        spring_strength=0.08,
        damping=0.4,
        overlap=0
    )
    
    net.from_nx(G)
    
    # Save to HTML
    logger.info(f" Saving to {OUTPUT_FILENAME}...")
    net.save_graph(OUTPUT_FILENAME)
    
    logger.info("Success!")
    logger.info(f"   Open {OUTPUT_FILENAME} in your browser to explore")
    logger.info("   Features:")
    logger.info("     • Drag to move nodes")
    logger.info("     • Scroll to zoom")
    logger.info("     • Click on filters (top-right) to highlight locations")
    logger.info("     • Hover over nodes for researcher details")
    
    return G, net

def analyze_communities(threshold=SIMILARITY_THRESHOLD):
    """
    Detect and analyze research communities/clusters
    """
    logger.info("🔍 Community Detection...")
    
    similarity_matrix, index, researchers = load_network_data()
    
    G = nx.Graph()
    for i in range(len(index)):
        G.add_node(i)
    
    for i in range(len(similarity_matrix)):
        for j in range(i + 1, len(similarity_matrix)):
            if similarity_matrix[i][j] >= threshold:
                G.add_edge(i, j)
    
    # Detect communities
    communities = list(nx.community.greedy_modularity_communities(G))
    
    logger.info(f"\n Found {len(communities)} research communities:")
    for com_idx, community in enumerate(communities, 1):
        logger.info(f"\n  Community {com_idx}: {len(community)} researchers")
        for node_id in list(community)[:5]:  # Show first 5
            name = index.iloc[node_id]["name"]
            logger.info(f"    - {name}")
        if len(community) > 5:
            logger.info(f"    ... and {len(community) - 5} more")
    
    return communities

# ── Example Usage ───────────────────────────────────────────────
if __name__ == "__main__":
    try:
        # Test 1: Create visualization
        logger.info("\n" + "="*60)
        logger.info("TEST 1: Network Visualization")
        logger.info("="*60)
        create_network_visualization(threshold=0.6)
        
        # Test 2: Community detection
        logger.info("\n" + "="*60)
        logger.info("TEST 2: Community Detection")
        logger.info("="*60)
        analyze_communities(threshold=0.55)
        
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
