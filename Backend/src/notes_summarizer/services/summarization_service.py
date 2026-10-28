from langchain_core.prompts import ChatPromptTemplate

from src.notes_summarizer.llm.groq_client import (
    GroqClient
)


class SummarizationService:

    def __init__(self) -> None:

        self.llm = (
            GroqClient()
            .get_llm()
        )

        print(
            "[SUMMARY] Summarization service initialized"
        )

    def summarize_documents(
        self,
        documents,
        max_words: int = 500
    ) -> str:

        if not documents:
            raise ValueError(
                "No documents provided."
            )

        print(
            f"[SUMMARY] Summarizing "
            f"{len(documents)} chunks"
        )

        # First stage:
        # summarize individual chunks

        chunk_summaries = []

        chunk_prompt = ChatPromptTemplate.from_template(
            """
You are a study assistant.

Summarize the following educational content.

Keep:
- definitions
- important concepts
- formulas
- examples
- important facts

Do not invent information.

CONTENT:

{content}
"""
        )

        for index, document in enumerate(documents):

            print(
                f"[SUMMARY] Processing chunk "
                f"{index + 1}/{len(documents)}"
            )

            chain = chunk_prompt | self.llm

            response = chain.invoke(
                {
                    "content": document.page_content
                }
            )

            chunk_summaries.append(
                response.content
            )

        # Second stage:
        # combine summaries

        combined = "\n\n".join(
            chunk_summaries
        )

        final_prompt = ChatPromptTemplate.from_template(
            """
You are an expert study assistant.

Create one clear final summary from the
individual chunk summaries below.

Maximum length: approximately {max_words} words.

Include:

1. Main topic
2. Important concepts
3. Key points
4. Important definitions
5. Important examples if available

Do not add information that isn't present.

CHUNK SUMMARIES:

{summaries}
"""
        )

        chain = final_prompt | self.llm

        response = chain.invoke(
            {
                "summaries": combined,
                "max_words": max_words
            }
        )

        print(
            "[SUMMARY] Final summary generated"
        )

        return response.content