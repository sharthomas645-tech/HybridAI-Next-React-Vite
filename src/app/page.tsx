"use client";

import { useEffect, useState } from "react";
import { generatePKCE, buildAuthUrl } from "@/lib/entra-auth";
import HybridHero from "@/components/HybridHero";

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
      <HybridHero />
      <div className="login-container login-container--hero">

        <div className="login-card">
          <h3 className="login-title">Attorney Access Portal</h3>
          <p style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Sign in with your Microsoft account via Azure Active Directory.
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
                Redirecting to Microsoft…
              </span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                Sign in with Microsoft
              </>
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
