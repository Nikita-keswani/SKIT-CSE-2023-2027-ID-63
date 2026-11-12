from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document

from src.notes_summarizer.llm.groq_client import GroqClient
from src.notes_summarizer.prompts.summary_prompt import SUMMARY_PROMPT


def parse_structured_summary(raw_text: str, document_id: str = "") -> dict:
    title = "Notes Summary"
    summary = ""
    key_points = []
    important_terms = []

    lines = raw_text.splitlines()
    current_section = None
    section_buffers = {
        "title": [],
        "summary": [],
        "key_points": [],
        "important_terms": [],
    }

    for line in lines:
        stripped = line.strip()
        upper = stripped.upper()
        if upper.startswith("TITLE:"):
            current_section = "title"
            val = stripped[6:].strip()
            if val:
                section_buffers["title"].append(val)
        elif upper.startswith("SUMMARY:"):
            current_section = "summary"
            val = stripped[8:].strip()
            if val:
                section_buffers["summary"].append(val)
        elif upper.startswith("KEY POINTS:") or upper == "KEY POINTS":
            current_section = "key_points"
        elif upper.startswith("IMPORTANT TERMS:") or upper == "IMPORTANT TERMS":
            current_section = "important_terms"
        elif current_section:
            section_buffers[current_section].append(line)

    if section_buffers["title"]:
        title = " ".join(section_buffers["title"]).strip().strip('"').strip("'")
    if section_buffers["summary"]:
        summary = "\n".join(section_buffers["summary"]).strip()
    else:
        summary = raw_text.strip()

    for item in section_buffers["key_points"]:
        s = item.strip()
        if s.startswith("- ") or s.startswith("* ") or (len(s) > 2 and s[0].isdigit() and s[1] in [".", ")"]):
            cleaned = s.lstrip("-*0123456789. )").strip()
            if cleaned:
                key_points.append(cleaned)
        elif s and not s.endswith(":"):
            key_points.append(s)

    for item in section_buffers["important_terms"]:
        s = item.strip()
        if s.startswith("- ") or s.startswith("* ") or (len(s) > 2 and s[0].isdigit() and s[1] in [".", ")"]):
            cleaned = s.lstrip("-*0123456789. )").strip()
            if cleaned:
                important_terms.append(cleaned)
        elif s and not s.endswith(":"):
            important_terms.append(s)

    return {
        "document_id": document_id,
        "title": title or "Study Notes Summary",
        "summary": summary or raw_text.strip(),
        "key_points": key_points if key_points else ["Summary generated based on provided notes."],
        "important_terms": important_terms if important_terms else ["Core Subject Notes"],
    }


class SummarizationService:

    def __init__(self) -> None:
        self.llm = GroqClient().get_llm()
        print("[SUMMARY] Summarization service initialized")

    def summarize_documents(
        self,
        documents,
        max_words: int = 500
    ) -> str:
        if not documents:
            raise ValueError("No documents provided.")

        print(f"[SUMMARY] Summarizing {len(documents)} chunks")

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
            print(f"[SUMMARY] Processing chunk {index + 1}/{len(documents)}")
            chain = chunk_prompt | self.llm
            response = chain.invoke({"content": document.page_content})
            chunk_summaries.append(response.content)

        combined = "\n\n".join(chunk_summaries)

        final_prompt = ChatPromptTemplate.from_template(
            """
You are an expert study assistant.

Create one clear final summary from the individual chunk summaries below.

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

        print("[SUMMARY] Final summary generated")
        return response.content

    def summarize_structured(
        self,
        documents,
        max_words: int = 500,
        style: str = "Study notes",
        document_id: str = ""
    ) -> dict:
        if not documents:
            raise ValueError("No documents provided.")

        style_instruction = "Organize with clear explanatory study notes."
        if "bullet" in style.lower():
            style_instruction = "Focus heavily on clear, concise bullet points and direct facts."
        elif "takeaway" in style.lower():
            style_instruction = "Highlight the most critical key takeaways and exam-relevant insights."

        if len(documents) == 1 and len(documents[0].page_content) <= 4000:
            context = documents[0].page_content
        else:
            chunk_summaries = []
            chunk_prompt = ChatPromptTemplate.from_template(
                """You are a study assistant. Summarize the following educational content concisely.
Keep definitions, key concepts, formulas, facts:
{content}"""
            )
            for doc in documents[:15]:
                chain = chunk_prompt | self.llm
                res = chain.invoke({"content": doc.page_content})
                chunk_summaries.append(res.content)
            context = "\n\n".join(chunk_summaries)

        prompt_tmpl = ChatPromptTemplate.from_template(SUMMARY_PROMPT)
        chain = prompt_tmpl | self.llm
        response = chain.invoke({
            "context": context,
            "max_words": max_words,
            "style_instructions": style_instruction
        })

        return parse_structured_summary(response.content, document_id)
