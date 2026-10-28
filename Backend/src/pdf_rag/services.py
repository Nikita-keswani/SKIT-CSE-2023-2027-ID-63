import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

from src.pdf_rag.loaders.pdf_loader import load_pdf
from src.pdf_rag.embeddings.embeddings import embed_texts, embed_query
from src.pdf_rag.vector_store.vector_store import create_collection, add_chunks, get_collection

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")


def _chunk_pages(pages: list[dict], chunk_size: int = 1000, overlap: int = 200) -> list[dict]:
    chunks = []
    step = chunk_size - overlap
    for page in pages:
        text = page["text"]
        for start in range(0, len(text), step):
            part = text[start:start + chunk_size].strip()
            if part:
                chunks.append({"text": part, "page": page["page"]})
    return chunks


def ingest_pdf(file_path: str, document_id: str) -> dict:
    pages = load_pdf(file_path)
    if not pages:
        raise ValueError("No readable text found in the PDF. Scanned PDFs require OCR and are not supported yet.")
    chunks = _chunk_pages(pages)
    vectors = embed_texts([chunk["text"] for chunk in chunks])
    collection = create_collection(document_id)
    add_chunks(collection, chunks, vectors, document_id)
    return {"pages": len(pages), "chunks": len(chunks)}


def answer_question(document_id: str, question: str) -> dict:
    collection = get_collection(document_id)
    count = collection.count()
    if count == 0:
        raise FileNotFoundError("No indexed chunks found for this document.")
    query_vector = embed_query(question)
    results = collection.query(query_embeddings=[query_vector], n_results=min(5, count))
    documents = (results.get("documents") or [[]])[0]
    metadatas = (results.get("metadatas") or [[]])[0]
    if not documents:
        return {"answer": "I could not find this information in the uploaded PDF.", "sources": []}
    sources = [{"content": text, "page": (metadata or {}).get("page")} for text, metadata in zip(documents, metadatas)]
    context = "\n\n".join(f"[Page {s['page']}]\n{s['content']}" for s in sources)
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing. Add it to Backend/.env.")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    client = Groq(api_key=api_key)
    prompt = f"""You are an academic assistant. Answer using ONLY the PDF context below. Do not use outside knowledge. If the answer is not supported by the context, reply exactly: \"I could not find this information in the uploaded PDF.\" Cite relevant page numbers when possible.\n\nPDF CONTEXT:\n{context}\n\nQUESTION:\n{question}\n\nANSWER:"""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=1000,
    )
    return {"answer": response.choices[0].message.content, "sources": sources}
