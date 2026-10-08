from langchain_core.documents import Document

from src.core.config import settings
from src.notes_summarizer.rag.vector_store import (
    VectorStoreService
)


class RetrieverService:

    def __init__(self) -> None:

        self.vector_store_service = (
            VectorStoreService()
        )

        print("[RETRIEVER] Retriever initialized")

    def retrieve(
        self,
        question: str,
        document_id: str,
        user_id: str
    ) -> list[Document]:

        print(
            f"[RETRIEVER] Question: {question}"
        )

        print(
            f"[RETRIEVER] Document ID: "
            f"{document_id}"
        )

        results = (
            self.vector_store_service
            .vector_store
            .similarity_search(
                question,
                k=settings.TOP_K,
                filter={
                    "$and": [
                        {
                            "document_id": document_id
                        },
                        {
                            "user_id": user_id
                        }
                    ]
                }
            )
        )

        print(
            f"[RETRIEVER] Retrieved "
            f"{len(results)} chunks"
        )

        return results