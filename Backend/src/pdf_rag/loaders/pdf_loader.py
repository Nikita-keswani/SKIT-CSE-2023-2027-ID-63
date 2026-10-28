import pymupdf


def load_pdf(file_path: str) -> list[dict]:
    """Extract non-empty text from each PDF page, preserving 1-based page numbers."""
    pages = []
    with pymupdf.open(file_path) as document:
        for page_number, page in enumerate(document, start=1):
            text = page.get_text("text").strip()
            if text:
                pages.append({"page": page_number, "text": text})
    return pages
