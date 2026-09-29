import { useState } from "react";
import { signup, googleLogin, saveToken } from "../api/auth";
import GoogleLoginButton from "./GoogleLoginButton";

export default function Signup({ onLoggedIn, goToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await signup(name, email, password);
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
      <h1>Create account</h1>

      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

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
            minLength={8}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <div className="auth-divider">or</div>

      <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={setError} />

      <p className="auth-switch">
        Already have an account?{" "}
        <button type="button" className="link-button" onClick={goToLogin}>
          Log in
        </button>
      </p>
    </div>
  );
}