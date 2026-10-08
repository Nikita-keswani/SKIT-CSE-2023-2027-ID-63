from src.notes_summarizer.rag.retriever import retrieve_chunks
from src.notes_summarizer.llm.groq_client import generate_answer


def ask_question(collection_name, question):
    sources = retrieve_chunks(
        collection_name,
        question
    )

    context_parts = []

    for source in sources:
        context_parts.append(
            f"""
[Page {source['page']}]

{source['content']}
"""
        )

    context = "\n".join(context_parts)

    answer = generate_answer(
        question,
        context
    )

    return {
        "answer": answer,
        "sources": sources
    }