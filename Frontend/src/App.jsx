import { useEffect, useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { fetchCurrentUser, getToken, clearToken } from "./api/auth";
import "./auth.css";

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
    return <p>Loading...</p>;
  }

  if (user) {
    return (
      <div className="auth-card">
        <h1>Welcome, {user.name}</h1>
        <p>{user.email}</p>
        <p>Signed in via {user.auth_provider}</p>
        <button onClick={handleLogout}>Log out</button>
      </div>
    );
  }

  return view === "login" ? (
    <Login onLoggedIn={setUser} goToSignup={() => setView("signup")} />
  ) : (
    <Signup onLoggedIn={setUser} goToLogin={() => setView("login")} />
  );
}