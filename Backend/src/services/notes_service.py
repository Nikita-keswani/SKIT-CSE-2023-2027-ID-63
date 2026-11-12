from pathlib import Path
from uuid import uuid4

from src.notes_summarizer.services.ingestion_service import (
    IngestionService
)
from src.notes_summarizer.services.summarization_service import (
    SummarizationService
)
from src.notes_summarizer.services.chat_service import (
    ChatService
)


class NotesService:

    def __init__(self) -> None:

        print("[NOTES] Initializing Notes Service")

        self.ingestion_service = (
            IngestionService()
        )

        self.summarization_service = (
            SummarizationService()
        )

        self.chat_service = (
            ChatService()
        )

        print("[NOTES] Notes Service initialized")

    def generate_document_id(self) -> str:

        document_id = str(uuid4())

        print(
            f"[NOTES] Generated document ID: "
            f"{document_id}"
        )

        return document_id

    def save_uploaded_file(
        self,
        file_bytes: bytes,
        filename: str,
        document_id: str
    ) -> str:

        upload_directory = Path(
            "data/uploads"
        )

        upload_directory.mkdir(
            parents=True,
            exist_ok=True
        )

        safe_filename = (
            f"{document_id}_{filename}"
        )

        file_path = (
            upload_directory /
            safe_filename
        )

        with open(
            file_path,
            "wb"
        ) as file:

            file.write(file_bytes)

        print(
            f"[NOTES] File saved: {file_path}"
        )

        return str(file_path)

    def ingest_document(
        self,
        file_path: str,
        document_id: str,
        user_id: str
    ) -> int:

        return self.ingestion_service.ingest(
            file_path=file_path,
            document_id=document_id,
            user_id=user_id
        )

    def summarize(
        self,
        documents,
        max_words: int = 500
    ) -> str:

        return (
            self.summarization_service
            .summarize_documents(
                documents,
                max_words
            )
        )

    def summarize_document(
        self,
        document_id: str,
        user_id: str,
        max_words: int = 500,
        style: str = "Study notes"
    ) -> dict:
        from langchain_core.documents import Document

        texts = []
        try:
            results = self.ingestion_service.vector_store.vector_store.get(
                where={"document_id": document_id}
            )
            texts = results.get("documents", [])
        except Exception as err:
            print(f"[NOTES] Vector store lookup error: {err}")

        if not texts:
            upload_dir = Path("data/uploads")
            matches = list(upload_dir.glob(f"{document_id}_*"))
            if matches:
                docs = self.ingestion_service._load_file(str(matches[0]))
                texts = [d.page_content for d in docs]

        if not texts:
            raise ValueError(f"No document content found for id {document_id}")

        documents = [Document(page_content=t) for t in texts]
        return self.summarization_service.summarize_structured(
            documents=documents,
            max_words=max_words,
            style=style,
            document_id=document_id
        )

    def summarize_text(
        self,
        text: str,
        max_words: int = 500,
        style: str = "Study notes"
    ) -> dict:
        from langchain_core.documents import Document

        doc = Document(page_content=text)
        chunks = self.ingestion_service.rag_pipeline.split_documents([doc])
        return self.summarization_service.summarize_structured(
            documents=chunks if chunks else [doc],
            max_words=max_words,
            style=style,
            document_id=self.generate_document_id()
        )

    def ask(
        self,
        question: str,
        document_id: str,
        user_id: str
    ):

        return self.chat_service.ask(
            question=question,
            document_id=document_id,
            user_id=user_id
        )
