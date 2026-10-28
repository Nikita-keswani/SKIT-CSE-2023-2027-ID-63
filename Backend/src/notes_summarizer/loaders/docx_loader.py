from pathlib import Path

from langchain_community.document_loaders import (
    Docx2txtLoader
)
from langchain_core.documents import Document


class DOCXDocumentLoader:

    def load(self, file_path: str) -> list[Document]:

        print(f"[DOCX LOADER] Loading: {file_path}")

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"DOCX file not found: {file_path}"
            )

        loader = Docx2txtLoader(str(path))

        documents = loader.load()

        print(
            f"[DOCX LOADER] Loaded "
            f"{len(documents)} documents"
        )

        return documents