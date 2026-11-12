import { getToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

export async function uploadNotes(file) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/notes/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse(res);
}

export async function summarizeDocument(documentId, maxWords = 500, style = "Study notes") {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/notes/${documentId}/summary`, {
    method: "POST",
    headers,
    body: JSON.stringify({ max_words: maxWords, style }),
  });
  return handleResponse(res);
}

export async function summarizeText(text, maxWords = 500, style = "Study notes") {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/notes/summarize-text`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text, max_words: maxWords, style }),
  });
  return handleResponse(res);
}

export async function chatWithNotes(documentId, question) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/notes/${documentId}/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question }),
  });
  return handleResponse(res);
}

