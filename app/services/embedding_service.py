from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")


def create_embedding(text: str):
    return model.encode(text)


def compute_similarity(a, b):
    return cosine_similarity([a], [b])[0][0]