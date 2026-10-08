import os
import chromadb


CHROMA_PATH = "./data/chroma"

os.makedirs(CHROMA_PATH, exist_ok=True)


client = chromadb.PersistentClient(
    path=CHROMA_PATH
)


def create_collection(document_id):
    collection_name = "pdf_" + document_id.replace("-", "")

    return client.create_collection(
        name=collection_name
    )


def get_collection(collection_name):
    return client.get_collection(
        name=collection_name
    )


def add_chunks(collection, chunks, embeddings, document_id):
    collection.add(
        ids=[
            f"{document_id}_{i}"
            for i in range(len(chunks))
        ],
        documents=[
            chunk["text"]
            for chunk in chunks
        ],
        embeddings=embeddings,
        metadatas=[
            {"page": chunk["page"]}
            for chunk in chunks
        ]
    )