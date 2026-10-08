from pathlib import Path

from langchain_community.document_loaders import (
    TextLoader
)
from langchain_core.documents import Document


class TextDocumentLoader:

    def load(self, file_path: str) -> list[Document]:

        print(f"[TEXT LOADER] Loading: {file_path}")

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Text file not found: {file_path}"
            )

        loader = TextLoader(
            str(path),
            encoding="utf-8"
        )

        documents = loader.load()

        print(
            f"[TEXT LOADER] Loaded "
            f"{len(documents)} documents"
        )

        return documents