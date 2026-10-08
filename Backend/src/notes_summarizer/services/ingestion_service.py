from pathlib import Path

from src.notes_summarizer.loaders.pdf_loader import (
    PDFDocumentLoader
)
from src.notes_summarizer.loaders.docx_loader import (
    DOCXDocumentLoader
)
from src.notes_summarizer.loaders.text_loader import (
    TextDocumentLoader
)
from src.notes_summarizer.rag.pipeline import (
    RAGPipeline
)
from src.notes_summarizer.rag.vector_store import (
    VectorStoreService
)


class IngestionService:

    def __init__(self) -> None:

        self.pdf_loader = PDFDocumentLoader()
        self.docx_loader = DOCXDocumentLoader()
        self.text_loader = TextDocumentLoader()

        self.rag_pipeline = RAGPipeline()
        self.vector_store = VectorStoreService()

        print("[INGESTION] Service initialized")

    def _load_file(
        self,
        file_path: str
    ):

        extension = (
            Path(file_path)
            .suffix
            .lower()
        )

        print(
            f"[INGESTION] File type: {extension}"
        )

        if extension == ".pdf":
            return self.pdf_loader.load(
                file_path
            )

        if extension == ".docx":
            return self.docx_loader.load(
                file_path
            )

        if extension == ".txt":
            return self.text_loader.load(
                file_path
            )

        raise ValueError(
            "Unsupported file type. "
            "Use PDF, DOCX or TXT."
        )

    def ingest(
        self,
        file_path: str,
        document_id: str,
        user_id: str
    ) -> int:

        print(
            "[INGESTION] Starting document ingestion"
        )

        documents = self._load_file(
            file_path
        )

        if not documents:
            raise ValueError(
                "No text could be extracted."
            )

        chunks = (
            self.rag_pipeline
            .split_documents(documents)
        )

        if not chunks:
            raise ValueError(
                "No chunks were created."
            )

        self.vector_store.add_documents(
            chunks,
            document_id=document_id,
            user_id=user_id
        )

        print(
            "[INGESTION] Ingestion completed"
        )

        return len(chunks)