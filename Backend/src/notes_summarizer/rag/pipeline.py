from langchain_text_splitters import (
    RecursiveCharacterTextSplitter
)

from src.core.config import settings


class RAGPipeline:

    def __init__(self) -> None:

        print("[RAG] Initializing text splitter...")

        self.splitter = (
            RecursiveCharacterTextSplitter(
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP,
                separators=[
                    "\n\n",
                    "\n",
                    ". ",
                    " ",
                    ""
                ]
            )
        )

        print("[RAG] Text splitter initialized")

    def split_documents(self, documents):

        print(
            f"[RAG] Splitting "
            f"{len(documents)} documents"
        )

        chunks = self.splitter.split_documents(
            documents
        )

        print(
            f"[RAG] Created "
            f"{len(chunks)} chunks"
        )

        return chunks