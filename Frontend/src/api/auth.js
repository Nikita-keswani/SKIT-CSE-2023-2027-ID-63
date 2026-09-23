const API_BASE_URL = "http://localhost:8000";

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Something went wrong");
  }
  return data;
}

export async function signup(name, email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function googleLogin(idToken) {
  const res = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
  return handleResponse(res);
}

export async function fetchCurrentUser(token) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export function saveToken(token) {
  localStorage.setItem("access_token", token);
}

export function getToken() {
  return localStorage.getItem("access_token");
}

export function clearToken() {
  localStorage.removeItem("access_token");
}