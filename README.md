# 🤖 AI Module - DZ Research Connect

Complete AI pipeline for researcher collaboration platform powered by semantic analysis and network visualization.

## 📊 System Overview

```
Data (researchers + papers)
    ↓
[embedding.py]  → Semantic embeddings (all-MiniLM-L6-v2)
    ↓
[similarity.py] → Researcher similarity matrix
    ↓
[recommender.py] → Collaborator recommendations + semantic search
[network_analysis.py] → Interactive network visualization
    ↓
[api.py] → FastAPI REST endpoints
```

## 🚀 Quick Start

### 1. Run Full Pipeline

```bash
cd ai
python pipeline.py --all
```

This will:
- ✅ Generate embeddings from researcher profiles
- ✅ Compute similarity matrix
- ✅ Build network visualization
- ✅ Run validation tests

### 2. Start API Server

```bash
python api.py
```

Then open: **http://localhost:8000/docs**

### 3. Explore Results

- **Network**: `data/research_network.html` (open in browser)
- **API**: Interactive docs at http://localhost:8000/docs

---

## 📚 Module Details

### embedding.py
**Purpose**: Build semantic embeddings from researcher profiles

**What it does**:
- Combines: researcher metadata + paper titles + abstracts
- Uses: Sentence Transformers (all-MiniLM-L6-v2)
- Outputs: `data/embeddings.npy` + `data/embedding_index.csv`

**Key Improvements**:
- ✨ Quality filtering (min/max abstract length)
- ✨ Better profile construction (includes h-index, topics)
- ✨ Robust error handling
- ✨ Progress logging

**Run**:
```bash
python embedding.py
```

---

### similarity.py
**Purpose**: Compute researcher-to-researcher similarity scores

**What it does**:
- Loads embeddings from embedding.py
- Computes NxN cosine similarity matrix
- Outputs: `data/similarity_matrix.npy`

**Key Improvements**:
- ✨ Statistical summaries (percentiles)
- ✨ Validation checks
- ✨ Efficient computation
- ✨ Manual testing function

**Run**:
```bash
python similarity.py
```

---

### recommender.py
**Purpose**: Recommend collaborators and search researchers

**Two Main Functions**:

#### `recommend_collaborators(researcher_id, top_n=10, min_score=0.3)`
Find similar researchers for a given researcher

```python
from ai.recommender import recommend_collaborators

result = recommend_collaborators(
    researcher_id="https://openalex.org/A5027644473",
    top_n=10,
    min_score=0.3
)

# Returns:
{
    "researcher": "Adel Ouannas",
    "count": 10,
    "results": [
        {
            "id": "...",
            "name": "...",
            "affiliation": "...",
            "location": "Diaspora",
            "h_index": 62,
            "topics": "...",
            "score": 0.7234
        },
        ...
    ]
}
```

#### `query_researchers(query_text, top_n=10, location_filter=None)`
Search researchers by semantic query

```python
from ai.recommender import query_researchers

result = query_researchers(
    query_text="machine learning artificial intelligence",
    top_n=10,
    location_filter="diaspora"  # Optional: "local", "diaspora", or None
)
```

**Key Improvements**:
- ✨ Fixed: query_researchers now returns results (was missing return statement)
- ✨ Caching: loads data once, reuses for multiple queries
- ✨ Error handling: graceful fallbacks for missing data
- ✨ Location normalization: consistent handling of location fields

**Run Tests**:
```bash
python recommender.py
```

---

### network_analysis.py
**Purpose**: Visualize researcher collaboration networks

**Main Function**: `create_network_visualization(threshold=0.6)`

```python
from ai.network_analysis import create_network_visualization

# Create interactive visualization
create_network_visualization(threshold=0.6)

# Output: data/research_network.html
```

**Visualization Features**:
- 🎨 **Node colors**: Blue (local) | Pink (diaspora) | Gray (unknown)
- 📏 **Node sizes**: Based on researcher connectivity
- 📊 **Edge weights**: Indicate research similarity
- 🖱️ **Interactive**: Drag, zoom, filter, hover for details

**Key Improvements**:
- ✨ Better statistics (density, components, centrality)
- ✨ Community detection function
- ✨ Improved error messages
- ✨ Color/size configuration

**Additional Function**: `analyze_communities(threshold=0.6)`
Detect and display research communities

**Run**:
```bash
python network_analysis.py
```

---

### config.py
**Purpose**: Centralized configuration

**What to configure**:
- Embedding model selection
- Similarity thresholds
- Recommendation parameters
- File paths
- Location categories

**Example**:
```python
from ai.config import *

print(EMBEDDING_MODEL)  # "all-MiniLM-L6-v2"
print(SIMILARITY_MIN_SCORE)  # 0.3
print(RECOMMENDATION_TOP_N)  # 10
```

---

### pipeline.py
**Purpose**: Orchestrate complete AI workflow

**Run full pipeline**:
```bash
python pipeline.py --run
```

**Test system**:
```bash
python pipeline.py --test
```

**Run all**:
```bash
python pipeline.py --all
```

---

### api.py
**Purpose**: REST API for all AI functions

**Endpoints**:

#### Health
```
GET /
GET /health
```

#### Recommendations
```
GET /api/recommend/{researcher_id}
    ?top_n=10
    &min_score=0.3
```

#### Search
```
GET /api/search
    ?query=machine learning
    &top_n=10
    &location=diaspora

GET /api/topics
    ?topic=deep learning
    &top_n=10
```

#### Network
```
GET /api/network
GET /api/network/download
```

#### Analytics
```
GET /api/stats
```

**Run**:
```bash
python api.py
```

**Access Docs**: http://localhost:8000/docs

---

## 🔧 Data Quality

### Input Data
- **researchers_enriched.csv**: 477 researchers
- **author_papers_linked.csv**: 21,738 author-paper links

### Data Quality Checks
✅ Handled missing institutions (18 null)
✅ Handled missing countries (25 null)
✅ Handled missing abstracts (8,169/21,738 = 37%)
✅ Normalized location field

### Quality Improvements Made
- Abstract length filtering (20-500 chars)
- Fallback topics for researchers with minimal data
- Case-insensitive field matching
- Null value handling with defaults

---

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| Researchers | 477 |
| Embeddings | 477 x 384 |
| Similarity Matrix | 477 x 477 |
| Network Edges (threshold 0.6) | ~12,000+ |
| Query Time | <100ms |
| Recommendation Time | <50ms |

---

## 🐛 Common Issues & Solutions

### Issue: "Missing data files"
**Solution**: Run pipeline first
```bash
python pipeline.py --run
```

### Issue: "No edges found in network"
**Solution**: Lower the threshold in network_analysis.py
```python
create_network_visualization(threshold=0.55)  # Instead of 0.6
```

### Issue: "Researcher not found"
**Solution**: Use correct researcher ID format (usually starts with "https://openalex.org/")

### Issue: "API won't start"
**Solution**: Ensure requirements installed
```bash
pip install -r ../requirements.txt
pip install pyvis  # May need to add this
```

---

## 🎯 Next Steps

### Short Term
1. ✅ Run pipeline to generate embeddings
2. ✅ Test all modules individually
3. ✅ Start API server
4. ✅ Explore network visualization

### Medium Term
1. Add user authentication to API
2. Implement result caching for faster queries
3. Add co-authorship network analysis
4. Integrate with frontend dashboard

### Long Term
1. Add LLM-based query understanding (GPT)
2. Implement collaborative filtering recommendations
3. Add graph neural networks for improved embeddings
4. Setup production deployment pipeline

---

## 📖 Example Usage

### Python Script
```python
from ai.recommender import recommend_collaborators, query_researchers
from ai.network_analysis import create_network_visualization

# Find collaborators
collab = recommend_collaborators("https://openalex.org/A5027644473", top_n=5)
print(f"Recommended collaborators for {collab['researcher']}:")
for r in collab['results']:
    print(f"  - {r['name']} ({r['score']:.2f})")

# Search by topic
results = query_researchers("deep learning healthcare")
print(f"\nFound {results['count']} researchers in deep learning healthcare")

# Create network (opens in browser)
create_network_visualization(threshold=0.6)
```

### API Requests
```bash
# Get recommendations
curl "http://localhost:8000/api/recommend/https://openalex.org/A5027644473?top_n=5"

# Search
curl "http://localhost:8000/api/search?query=machine%20learning&top_n=10"

# Filter by location
curl "http://localhost:8000/api/search?query=AI&location=diaspora"

# Get stats
curl "http://localhost:8000/api/stats"
```

---

## 🤝 Contributing

To improve the AI pipeline:
1. Update configuration in `config.py`
2. Test changes in respective module
3. Run `pipeline.py --test` to validate
4. Update this README

---

## 📝 License

Part of DZ Research Connect platform.

---

## 🎓 Research Background

**Problem**: Algerian researchers are scattered across institutions and geography, missing collaboration opportunities.

**Solution**: AI-powered similarity-based recommendations to connect researchers with:
- Similar research interests
- Complementary expertise
- Geographic diversity (connecting local + diaspora)
- Potential for co-supervision and research visits

**Technology Stack**:
- Sentence Transformers (embeddings)
- Scikit-learn (similarity)
- NetworkX (graph analysis)
- Pyvis (visualization)
- FastAPI (API)

---

**Questions?** Check the module docstrings or run with `--help`
