# PDF RAG component

This is an independent PDF question-answering component **inside the Backend application**. It is separate from `src/notes_summarizer/` and uses its own ChromaDB and upload directories under `Backend/data/pdf_rag/`.

## API
- `POST /api/pdf-rag/upload` — upload and index a text-based PDF.
- `POST /api/pdf-rag/{document_id}/ask` — answer a question from the indexed PDF and return source chunks/pages.

## Configuration
Set `GROQ_API_KEY` and optionally `GROQ_MODEL` in `Backend/.env`. Never commit `.env`.

## Run
From `Backend/` with its virtual environment active:

```powershell
uvicorn main:app --reload
```

Open `http://127.0.0.1:8000/docs` and look for the `PDF RAG` tag. The Notes Summarizer remains available under its existing `/notes` routes.
