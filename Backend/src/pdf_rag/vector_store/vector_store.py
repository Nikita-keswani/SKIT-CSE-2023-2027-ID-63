from pathlib import Path
import chromadb


BACKEND_DIR = Path(__file__).resolve().parents[3]
CHROMA_DIR = BACKEND_DIR / "data" / "pdf_rag" / "chroma"
CHROMA_DIR.mkdir(parents=True, exist_ok=True)
_client = chromadb.PersistentClient(path=str(CHROMA_DIR))


def collection_name(document_id: str) -> str:
    # Chroma collection names must be valid and document-specific.
    return "pdf_" + document_id.replace("-", "")


def create_collection(document_id: str):
    name = collection_name(document_id)
    try:
        _client.delete_collection(name)
    except Exception:
        pass
    return _client.create_collection(name=name)


def get_collection(document_id: str):
    try:
        return _client.get_collection(collection_name(document_id))
    except Exception as exc:
        raise FileNotFoundError("No indexed PDF found for this document ID.") from exc


def add_chunks(collection, chunks: list[dict], vectors: list[list[float]], document_id: str):
    collection.add(
        ids=[f"{document_id}_{i}" for i in range(len(chunks))],
        documents=[chunk["text"] for chunk in chunks],
        embeddings=vectors,
        metadatas=[{"page": int(chunk["page"])} for chunk in chunks],
    )
