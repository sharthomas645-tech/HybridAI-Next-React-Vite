"use client";

import { useEffect, useState } from "react";
import { generatePKCE, buildAuthUrl } from "@/lib/cognito";
import AuroraBackground from "@/components/AuroraBackground";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    sessionStorage.removeItem("pkce_verifier");
  }, []);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { codeVerifier, codeChallenge } = await generatePKCE();
      sessionStorage.setItem("pkce_verifier", codeVerifier);
      const authUrl = buildAuthUrl(codeChallenge);
      window.location.href = authUrl;
    } catch {
      setError("Failed to initiate login. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <AuroraBackground />
      <div className="login-container">
        <div className="brand-section">
          <img src="/hybridai.png" alt="HybridAI" className="hybrid-logo-img" />
          <h1 className="subtitle-1">Medical Chronology &amp; Analyzer Intelligence</h1>
          <h2 className="subtitle-2">We Make It Make Sense</h2>
        </div>

        <div className="login-card">
          <h3 className="login-title">Attorney Access Portal</h3>
          <p style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Sign in with your HybridAI credentials via our secure Cognito identity provider.
          </p>
          {error && <p className="error-message">{error}</p>}
          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Redirecting to Cognito…
              </span>
            ) : (
              <>🔐 Sign In with Cognito</>
            )}
          </button>
          <p className="login-footer">
            Secure PKCE OAuth 2.0 · Powered by{" "}
            <span className="gradient-text-inline">HybridAI</span>
          </p>
        </div>
      </div>
    </>
  );
}
