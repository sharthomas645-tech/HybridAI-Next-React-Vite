import { signIn, signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import { useState, type FC } from "react";

interface LoginProps {
  onLogin: (user: { username: string; email: string }) => void;
}

const Login: FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn({ username: email, password });
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      const emailAttr = idToken?.payload?.email as string | undefined;
      onLogin({ username: user.username, email: emailAttr ?? email });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Branding */}
      <div className="brand-section">
        <div className="hybrid-logo">
          <span className="logo-h">H</span>
          <span className="logo-text">ybridAI</span>
        </div>
        <h1 className="subtitle-1">Medical Chronology &amp; Analyzer Intelligence</h1>
        <h2 className="subtitle-2">We Make It Make Sense</h2>
      </div>

      {/* Login Card */}
      <div className="login-card">
        <h3 className="login-title">Sign In</h3>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="form-input"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        <p className="login-footer">
          Secure access powered by{" "}
          <span className="gradient-text-inline">HybridAI</span>
        </p>
      </div>
    </div>
  );
};

export { signOut };
export default Login;
