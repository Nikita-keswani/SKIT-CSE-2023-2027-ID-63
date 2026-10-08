from langchain_groq import ChatGroq

from src.core.config import settings


class GroqClient:
    """
    Creates and manages the Groq LLM.
    """

    def __init__(self) -> None:
        print("[LLM] Initializing Groq client...")

        self.llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.2,
        )

        print(
            f"[LLM] Groq client initialized: "
            f"{settings.GROQ_MODEL}"
        )

    def get_llm(self) -> ChatGroq:
        return self.llm