import { getToken } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null
        ? data.detail || data.message
        : data;

    throw new Error(message || "Something went wrong.");
  }

  return data;
}

function authenticatedHeaders() {
  const token = getToken();

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

// NOTES SUMMARIZER

export async function uploadNotes(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/notes/upload`, {
    method: "POST",
    headers: authenticatedHeaders(),
    body: formData,
  });

  return handleResponse(response);
}

export async function chatWithNotes(documentId, question) {
  const response = await fetch(
    `${API_BASE_URL}/notes/${encodeURIComponent(documentId)}/chat`,
    {
      method: "POST",
      headers: {
        ...authenticatedHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    }
  );

  return handleResponse(response);
}

// PDF RAG

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/pdf-rag/upload`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}

export async function askPdfQuestion(documentId, question) {
  const response = await fetch(
    `${API_BASE_URL}/api/pdf-rag/${encodeURIComponent(documentId)}/ask`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    }
  );

  return handleResponse(response);
}