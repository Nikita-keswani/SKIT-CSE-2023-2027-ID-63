const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/pdf-rag/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function askPdf(documentId, question) {
  const res = await fetch(`${API_BASE_URL}/api/pdf-rag/${documentId}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });
  return handleResponse(res);
}