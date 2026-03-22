"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/AuroraBackground";

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");

      if (errorParam) {
        const desc = params.get("error_description") ?? errorParam;
        setErrorMessage(desc);
        setStatus("error");
        return;
      }

      if (!code) {
        setErrorMessage("No authorization code received.");
        setStatus("error");
        return;
      }

      const codeVerifier = sessionStorage.getItem("pkce_verifier");
      if (!codeVerifier) {
        setErrorMessage("PKCE state mismatch. Please try logging in again.");
        setStatus("error");
        return;
      }

      sessionStorage.removeItem("pkce_verifier");

      const redirectUri = `${window.location.origin}/auth/callback`;

      try {
        const res = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, codeVerifier, redirectUri }),
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string; detail?: string };
          throw new Error(data.detail ?? data.error ?? "Authentication failed");
        }

        router.replace("/dashboard");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Authentication failed";
        setErrorMessage(msg);
        setStatus("error");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <>
      <AuroraBackground />
      <div className="login-container">
        <div className="login-card" style={{ textAlign: "center" }}>
          {status === "processing" ? (
            <>
              <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
              <h3 className="login-title">Completing Sign In…</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                Securely exchanging authorization tokens.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
              <h3 className="login-title" style={{ color: "#f87171" }}>
                Authentication Failed
              </h3>
              <p className="error-message" style={{ marginBottom: "1.5rem" }}>
                {errorMessage}
              </p>
              <a href="/" className="login-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                Return to Login
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
