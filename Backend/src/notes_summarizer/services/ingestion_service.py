from src.notes_summarizer.loaders.pdf_loader import load_pdf
from src.notes_summarizer.rag.embeddings import create_embeddings
from src.notes_summarizer.rag.vector_store import (
    create_collection,
    add_chunks
)


def create_chunks(pages):
    chunks = []

    chunk_size = 1000
    overlap = 200

    for page in pages:
        text = page["text"]

        start = 0

        while start < len(text):
            end = start + chunk_size

            chunk = text[start:end].strip()

            if chunk:
                chunks.append({
                    "text": chunk,
                    "page": page["page"]
                })

            start += chunk_size - overlap

    return chunks


def ingest_pdf(file_path, document_id):
    pages = load_pdf(file_path)

    if not pages:
        raise ValueError(
            "No readable text found in PDF."
        )

    chunks = create_chunks(pages)

    texts = [
        chunk["text"]
        for chunk in chunks
    ]

    embeddings = create_embeddings(texts)

    collection = create_collection(document_id)

    add_chunks(
        collection,
        chunks,
        embeddings,
        document_id
    )

    return {
        "pages": len(pages),
        "chunks": len(chunks),
        "collection": collection.name
    }