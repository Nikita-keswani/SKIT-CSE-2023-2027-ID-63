SUMMARY_PROMPT = """
You are an expert academic study assistant.

Create a clear and useful summary of the provided educational content.
Format style: {style_instructions}
Target word count: approx. {max_words} words.

Requirements:
1. Give the main topic/title under TITLE.
2. Explain the content in simple, easy-to-understand language under SUMMARY.
3. Extract the key points as bullet items under KEY POINTS.
4. List important terms or definitions under IMPORTANT TERMS.
5. Do not invent information; use only the provided content.

Return the answer in this EXACT format:

TITLE:
<short title>

SUMMARY:
<summary text>

KEY POINTS:
- point 1
- point 2
- point 3

IMPORTANT TERMS:
- term 1
- term 2
- term 3

CONTENT:
{context}
"""
