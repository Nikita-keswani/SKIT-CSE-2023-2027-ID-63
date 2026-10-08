from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document


class PDFDocumentLoader:

    def load(self, file_path: str) -> list[Document]:

        print(f"[PDF LOADER] Loading: {file_path}")

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"PDF file not found: {file_path}"
            )

        loader = PyPDFLoader(str(path))

        documents = loader.load()

        print(
            f"[PDF LOADER] Loaded "
            f"{len(documents)} pages"
        )

        return documents