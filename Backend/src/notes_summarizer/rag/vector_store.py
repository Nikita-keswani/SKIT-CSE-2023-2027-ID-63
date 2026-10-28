from pathlib import Path

from langchain_chroma import Chroma

from src.core.config import settings
from src.notes_summarizer.rag.embeddings import (
    EmbeddingService
)


class VectorStoreService:

    def __init__(self) -> None:

        print("[VECTOR DB] Initializing Chroma...")

        Path(settings.CHROMA_DIR).mkdir(
            parents=True,
            exist_ok=True
        )

        embedding_service = EmbeddingService()

        self.vector_store = Chroma(
            collection_name="notes_documents",
            embedding_function=(
                embedding_service.get_embeddings()
            ),
            persist_directory=settings.CHROMA_DIR
        )

        print("[VECTOR DB] Chroma initialized")

    def add_documents(
        self,
        documents,
        document_id: str,
        user_id: str
    ) -> list[str]:

        print(
            f"[VECTOR DB] Adding documents "
            f"for document_id={document_id}"
        )

        for index, document in enumerate(documents):

            document.metadata["document_id"] = (
                document_id
            )

            document.metadata["user_id"] = (
                user_id
            )

            document.metadata["chunk_id"] = (
                f"{document_id}_{index}"
            )

        ids = self.vector_store.add_documents(
            documents
        )

        print(
            f"[VECTOR DB] Added {len(ids)} chunks"
        )

        return ids

    def delete_document(
        self,
        document_id: str
    ) -> None:

        print(
            f"[VECTOR DB] Deleting document "
            f"{document_id}"
        )

        results = self.vector_store.get(
            where={
                "document_id": document_id
            }
        )

        ids = results.get("ids", [])

        if ids:
            self.vector_store.delete(
                ids=ids
            )

        print(
            f"[VECTOR DB] Deleted {len(ids)} chunks"
        )