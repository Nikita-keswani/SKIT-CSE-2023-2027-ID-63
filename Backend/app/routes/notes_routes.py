import os
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status
)

from src.core.config import settings
from src.schemas.notes_schema import (
    UploadResponse,
    SummaryRequest,
    SummaryResponse,
    ChatRequest,
    ChatResponse
)
from src.services.notes_service import (
    NotesService
)

# IMPORTANT:
# Change this import only if your existing
# middleware uses a different dependency name.
from app.middleware.auth_middleware import (
    get_current_user
)


router = APIRouter(
    prefix="/notes",
    tags=["Notes Summarizer"]
)


notes_service = NotesService()


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt"
}


@router.post(
    "/upload",
    response_model=UploadResponse
)
async def upload_notes(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):

    print(
        f"[API] /notes/upload called "
        f"by user={current_user}"
    )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required."
        )

    extension = (
        Path(file.filename)
        .suffix
        .lower()
    )

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Allowed: PDF, DOCX, TXT"
            )
        )

    file_bytes = await file.read()

    max_size = (
        settings.MAX_FILE_SIZE_MB
        * 1024
        * 1024
    )

    if len(file_bytes) > max_size:

        raise HTTPException(
            status_code=413,
            detail=(
                f"File size cannot exceed "
                f"{settings.MAX_FILE_SIZE_MB} MB."
            )
        )

    # Adapt this line to your existing auth schema.
    user_id = str(
        current_user["id"]
        if isinstance(current_user, dict)
        else current_user.id
    )

    document_id = (
        notes_service.generate_document_id()
    )

    try:

        file_path = (
            notes_service.save_uploaded_file(
                file_bytes=file_bytes,
                filename=file.filename,
                document_id=document_id
            )
        )

        chunks = (
            notes_service.ingest_document(
                file_path=file_path,
                document_id=document_id,
                user_id=user_id
            )
        )

        print(
            "[API] Upload completed successfully"
        )

        return UploadResponse(
            document_id=document_id,
            filename=file.filename,
            message="Document uploaded successfully.",
            chunks_created=chunks
        )

    except Exception as error:

        print(
            f"[ERROR] Upload failed: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to process document."
        )


@router.post(
    "/{document_id}/chat",
    response_model=ChatResponse
)
async def chat_with_notes(
    document_id: str,
    request: ChatRequest,
    current_user=Depends(get_current_user)
):

    print(
        f"[API] /notes/{document_id}/chat"
    )

    user_id = str(
        current_user["id"]
        if isinstance(current_user, dict)
        else current_user.id
    )

    try:

        result = notes_service.ask(
            question=request.question,
            document_id=document_id,
            user_id=user_id
        )

        return ChatResponse(
            document_id=document_id,
            question=request.question,
            answer=result["answer"],
            sources=result["sources"]
        )

    except Exception as error:

        print(
            f"[ERROR] Chat failed: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to answer question."
        )