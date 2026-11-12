import { useEffect, useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import { fetchCurrentUser, getToken, clearToken } from "./api/auth";
import "./auth.css";
import "./styles.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login"); // "login" | "signup"
  const [checkingSession, setCheckingSession] = useState(true);

  // On page load, if a token is already saved, try to restore the session.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }
    fetchCurrentUser(token)
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setCheckingSession(false));
  }, []);

  function handleLogout() {
    clearToken();
    setUser(null);
    setView("login");
  }

  if (checkingSession) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-spinner" />
        <p>Loading your study space...</p>
      </div>
    );
  }

  // Once user logs in, show the full Studywise dashboard (Overview, Notes Summarizer, PDF RAG, Library)
  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return view === "login" ? (
    <Login onLoggedIn={setUser} goToSignup={() => setView("signup")} />
  ) : (
    <Signup onLoggedIn={setUser} goToLogin={() => setView("login")} />
  );
}