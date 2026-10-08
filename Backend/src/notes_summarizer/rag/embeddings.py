from langchain_huggingface import HuggingFaceEmbeddings

from src.core.config import settings


class EmbeddingService:

    def __init__(self) -> None:

        print("[EMBEDDING] Loading embedding model...")

        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={
                "device": "cpu"
            },
            encode_kwargs={
                "normalize_embeddings": True
            }
        )

        print(
            "[EMBEDDING] Embedding model loaded successfully"
        )

    def get_embeddings(self) -> HuggingFaceEmbeddings:
        return self.embeddings