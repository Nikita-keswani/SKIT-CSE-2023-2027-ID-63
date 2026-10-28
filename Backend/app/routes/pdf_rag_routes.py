import os
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from src.pdf_rag.services import ingest_pdf, answer_question

router = APIRouter(prefix="/api/pdf-rag", tags=["PDF RAG"])
BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BACKEND_DIR / "data" / "pdf_rag" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE_MB = int(os.getenv("PDF_RAG_MAX_FILE_SIZE_MB", "20"))


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"PDF must be no larger than {MAX_FILE_SIZE_MB} MB.")
    document_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{document_id}.pdf"
    file_path.write_bytes(content)
    try:
        result = ingest_pdf(str(file_path), document_id)
    except ValueError as exc:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        file_path.unlink(missing_ok=True)
        print(f"[PDF RAG] Indexing failed: {exc}")
        raise HTTPException(status_code=500, detail="PDF indexing failed. Check the backend terminal.") from exc
    return {
        "success": True,
        "document_id": document_id,
        "filename": Path(file.filename).name,
        "pages": result["pages"],
        "chunks": result["chunks"],
        "message": "PDF uploaded and indexed successfully.",
    }


@router.post("/{document_id}/ask")
def ask_pdf(document_id: str, request: AskRequest):
    try:
        result = answer_question(document_id, request.question)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Document not found. Upload the PDF again.") from exc
    except Exception as exc:
        print(f"[PDF RAG] Question answering failed: {exc}")
        raise HTTPException(status_code=502, detail="Question answering failed. Check the backend terminal and Groq configuration.") from exc
    return {"success": True, "document_id": document_id, "question": request.question, **result}
