from src.notes_summarizer.rag.embeddings import create_query_embedding
from src.notes_summarizer.rag.vector_store import get_collection


def retrieve_chunks(collection_name, question, top_k=5):
    collection = get_collection(collection_name)

    query_embedding = create_query_embedding(question)

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k
    )

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]

    sources = []

    for document, metadata in zip(documents, metadatas):
        sources.append({
            "content": document,
            "page": metadata["page"]
        })

    return sources