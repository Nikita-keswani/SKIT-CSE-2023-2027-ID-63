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