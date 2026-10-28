from langchain_core.prompts import (
    ChatPromptTemplate
)

from src.notes_summarizer.llm.groq_client import (
    GroqClient
)
from src.notes_summarizer.rag.retriever import (
    RetrieverService
)


class ChatService:

    def __init__(self) -> None:

        self.llm = (
            GroqClient()
            .get_llm()
        )

        self.retriever = (
            RetrieverService()
        )

        print("[CHAT] Chat service initialized")

    def ask(
        self,
        question: str,
        document_id: str,
        user_id: str
    ):

        print(
            f"[CHAT] User question: {question}"
        )

        documents = self.retriever.retrieve(
            question=question,
            document_id=document_id,
            user_id=user_id
        )

        if not documents:

            return {
                "answer": (
                    "I couldn't find this information "
                    "in the uploaded notes."
                ),
                "sources": []
            }

        context_parts = []

        for document in documents:

            context_parts.append(
                document.page_content
            )

        context = "\n\n---\n\n".join(
            context_parts
        )

        prompt = ChatPromptTemplate.from_template(
            """
You are an AI study assistant.

Answer the question using ONLY the context.

If the context does not contain the answer,
say:

"I couldn't find this information in the
uploaded notes."

Context:

{context}

Question:

{question}

Answer:
"""
        )

        chain = prompt | self.llm

        response = chain.invoke(
            {
                "context": context,
                "question": question
            }
        )

        sources = []

        for document in documents:

            sources.append(
                {
                    "chunk_id": document.metadata.get(
                        "chunk_id"
                    ),
                    "page": document.metadata.get(
                        "page"
                    ),
                    "content": document.page_content[
                        :300
                    ]
                }
            )

        print("[CHAT] Answer generated")

        return {
            "answer": response.content,
            "sources": sources
        }