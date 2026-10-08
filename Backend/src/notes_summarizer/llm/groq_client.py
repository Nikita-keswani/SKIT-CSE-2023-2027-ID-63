import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()


api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY is missing from .env")


client = Groq(api_key=api_key)


def generate_answer(question, context):
    prompt = f"""
You are an AI Academic Assistant.

Answer the user's question using ONLY
the information provided in the PDF context.

Do not use outside knowledge.

If the answer is not present in the PDF,
say:

"I could not find this information in the uploaded PDF."

Give a clear and concise answer.

Mention the relevant page number when possible.

PDF CONTEXT:
-------------------------

{context}

-------------------------

QUESTION:

{question}

ANSWER:
"""

    response = client.chat.completions.create(
        model=os.getenv(
            "GROQ_MODEL",
            "llama-3.3-70b-versatile"
        ),
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1,
        max_tokens=1000
    )

    return response.choices[0].message.content