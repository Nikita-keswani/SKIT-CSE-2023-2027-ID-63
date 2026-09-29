import { useState } from "react";
import { login, googleLogin, saveToken } from "../api/auth";
import GoogleLoginButton from "./GoogleLoginButton";

export default function Login({ onLoggedIn, goToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      saveToken(data.access_token);
      onLoggedIn(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(idToken) {
    setError("");
    try {
      const data = await googleLogin(idToken);
      saveToken(data.access_token);
      onLoggedIn(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-card">
      <h1>Log in</h1>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="auth-divider">or</div>

      <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={setError} />

      <p className="auth-switch">
        Don't have an account?{" "}
        <button type="button" className="link-button" onClick={goToSignup}>
          Sign up
        </button>
      </p>
    </div>
  );
}