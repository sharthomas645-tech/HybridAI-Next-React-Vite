import { useState } from "react";
import { generatePKCE, buildAuthUrl } from "@/lib/entra-auth";
import AuroraBackground from "@/components/AuroraBackground";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { codeVerifier, codeChallenge } = await generatePKCE();
      sessionStorage.setItem("pkce_verifier", codeVerifier);
      const authUrl = buildAuthUrl(codeChallenge);
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate login");
      setLoading(false);
    }
  };

  return (
    <>
      <AuroraBackground />
      <div className="login-container">
        <div className="login-card">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <img
              src="/hybridai.png"
              alt="HybridAI Logo"
              style={{ height: "56px", marginBottom: "1rem" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <h1 className="login-title">HybridAI MedLegal</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "0.5rem" }}>
              Secure attorney portal for PHI document analysis
            </p>
          </div>

          {error && (
            <p className="error-message" style={{ marginBottom: "1rem" }}>
              {error}
            </p>
          )}

          <button
            type="button"
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" />
                Redirecting to Microsoft…
              </>
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

          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "1.5rem" }}>
            By signing in you agree to the applicable terms of service.
            <br />
            Protected health information is encrypted in transit and at rest.
          </p>
        </div>
      </div>
    </>
  );
}
