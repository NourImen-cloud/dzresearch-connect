# DzResearch Connect: Technical Implementation Report

## 1. Executive Summary
The **DzResearch Connect** project aims to establish an AI-powered platform tailored to connecting Algerian researchers within the country and across the international diaspora. This platform focuses on intelligent discovery, profile connections, and collaboration clustering. 

To date, the **core Data and Artificial Intelligence (AI) components** for the Minimum Viable Product (MVP) have been successfully engineered and tested. The backend and frontend are currently pending, but the underlying intelligent engine is fully operational.

---

## 2. Dataset Preparation & Schema
The project currently manages research data falling comfortably within the MVP constraints (handling 477 researchers securely mapping to ~700 papers).

Two refined datasets are central to the current architecture:
- **`researchers_enriched.csv`**: Contains structured tabular data about the researchers. Key fields include `name`, `location` (Algeria vs. Diaspora), and `institution`.
- **`author_papers_linked.csv`**: Functions as a relational bridge between researchers and their scholarly outputs, natively embedding the `title` and `abstract` for each paper matched directly via `author_id`.

---

## 3. Intelligent Embedding Pipeline (`ai/embedding.py`)
To effectively compare researchers, the system must translate human-readable profiles into mathematical vectors.
* **Component Used**: We utilized HuggingFace's `sentence-transformers` library, specifically the `all-MiniLM-L6-v2` model. This model is exceptionally fast, operates locally without API fees, and is highly effective at capturing semantic meaning in English scientific texts.
* **Mechanism**: 
  1. The script bridges data between `researchers_enriched.csv` and `author_papers_linked.csv`.
  2. For a specific researcher, it compounds their `name`, `institution`, `topics`, and up to 400 characters of every `abstract` they have authored into a single dense `profile_text` paragraph.
  3. It structurally maps these string profiles into 384-dimensional mathematical arrays.
* **Output**: Generates serialized `.npy` files (`data/embeddings.npy` and `data/embedding_index.csv`) caching computations for extremely fast retrieval.

---

## 4. Similarity Matrix Generator (`ai/similarity.py`)
With the vector embeddings established, calculating the distance between the vectors quantifies the "similarity" between two researchers.
* **Component Used**: `sklearn.metrics.pairwise.cosine_similarity`.
* **Mechanism**: It cross-evaluates all 477 vector embeddings against one another computing an `NxN` density matrix. A score of `1.0` means identical research footprints, whereas lower scores imply diverging topics.
* **Output**: Produces and caches `data/similarity_matrix.npy`. This pre-calculation step guarantees that finding a specific researcher's most similar colleagues will take mere milliseconds later during live web interactions.

---

## 5. Recommendation & Search System (`ai/recommender.py`)
This script acts as the prototype interface for the eventual backend integration. It provides two distinct functionalities:
1. **Collaborator Recommendations (`recommend_collaborators`)**: 
   * Reads the `similarity_matrix.npy`.
   * Given a specific `researcher_id`, the algorithm looks up their highest-scoring peers and filters them dynamically above a certain similarity threshold (e.g., `>0.3`).
2. **Smart Natural Language Queries (`query_researchers`)**: 
   * Converts a user search query (e.g., *"Algerian researchers in NLP AI"*) into a vector in real-time.
   * Compares the query vector directly against all researcher vectors.
   * Supports **Location Filtering**: Enables precise queries targetting only local or diaspora researchers.

---

## 6. Research Network Visualization (`ai/network_analysis.py`)
Addressing the requirement for **Research Network Visualization**, an automated graphing script was built to give users an immediate tactical overview of the collaboration clusters visually.
* **Components Used**: algorithmic `NetworkX` linked with the physics rendering engine `Pyvis`.
* **Mechanism**:
  1. **Edge Filtering**: Trims the dataset to map connections strictly where researchers possess dense thematic overlaps (Similarity > `0.6`).
  2. **Eigenvector Centrality**: Algorithmically scores "hubs"—researchers positioned heavily amidst other strongly connected individuals. Nodes belonging to these hubs are scaled up visually in size.
  3. **Visual Distinction**: Automatically groups Diaspora members (colored pink) alongside Local Algerian members (colored teal).
* **Output**: Renders an interactive, force-directed graph to a flat web file (`data/research_network.html`). Users can drag researchers around, zoom in, hover to read tooltips of their affiliations, and instantly single out the dense Algerian research clusters.

---

## 7. Next Steps Forward
1. **Develop the Backend (FastAPI / Flask)**: We need to wrap `ai/recommender.py` inside HTTP API endpoints (e.g., `GET /api/search?q=machine+learning` and `GET /api/recommend/{id}`).
2. **Setup Frontend Architecture**: Determine a responsive framework (e.g., Next.js, Vite with React) to design the user-facing Researcher Interface and integrate the interactive cluster visualization natively.
