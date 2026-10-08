import os
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from src.notes_summarizer.services.ingestion_service import ingest_pdf
from src.notes_summarizer.services.chat_service import ask_question


router = APIRouter(
    prefix="/api/notes",
    tags=["PDF RAG"]
)


UPLOAD_DIR = "./data/uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


documents = {}


class QuestionRequest(BaseModel):
    question: str


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    document_id = str(uuid.uuid4())

    file_path = os.path.join(
        UPLOAD_DIR,
        f"{document_id}.pdf"
    )

    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        result = ingest_pdf(
            file_path,
            document_id
        )

        documents[document_id] = {
            "filename": file.filename,
            "collection": result["collection"]
        }

        return {
            "success": True,
            "document_id": document_id,
            "filename": file.filename,
            "pages": result["pages"],
            "chunks": result["chunks"],
            "message": "PDF uploaded and indexed successfully."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/{document_id}/ask")
async def ask_pdf(
    document_id: str,
    request: QuestionRequest
):

    if document_id not in documents:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    result = ask_question(
        documents[document_id]["collection"],
        request.question
    )

    return {
        "success": True,
        "question": request.question,
        **result
    }