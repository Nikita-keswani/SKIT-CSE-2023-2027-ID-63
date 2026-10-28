from pydantic import BaseModel, Field
from typing import List, Optional


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    message: str
    chunks_created: int


class SummaryRequest(BaseModel):
    max_words: int = Field(
        default=500,
        ge=100,
        le=3000
    )


class SummaryResponse(BaseModel):
    document_id: str
    title: str
    summary: str
    key_points: List[str]
    important_terms: List[str]


class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=3,
        max_length=1000
    )


class SourceInfo(BaseModel):
    chunk_id: Optional[str] = None
    page: Optional[int] = None
    content: str


class ChatResponse(BaseModel):
    document_id: str
    question: str
    answer: str
    sources: List[SourceInfo]


class DocumentResponse(BaseModel):
    document_id: str
    filename: str
    file_type: str
    status: str
    chunks_created: int