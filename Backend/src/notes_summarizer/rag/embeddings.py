from sentence_transformers import SentenceTransformer


embedding_model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)


def create_embeddings(texts):
    embeddings = embedding_model.encode(
        texts,
        normalize_embeddings=True
    )

    return embeddings.tolist()


def create_query_embedding(question):
    embedding = embedding_model.encode(
        [question],
        normalize_embeddings=True
    )

    return embedding.tolist()