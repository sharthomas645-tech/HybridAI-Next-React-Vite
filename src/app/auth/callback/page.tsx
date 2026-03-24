import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForTokens } from "@/lib/entra-auth";
import { buildSession, saveSession } from "@/lib/auth";
import { AWS_APIS } from "@/lib/constants";
import AuroraBackground from "@/components/AuroraBackground";

interface AwsTokenExchangeResponse {
  token?: string;
  access_token?: string;
  expires_in?: number;
  message?: string;
}

export default function CallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");

      if (errorParam) {
        const desc = params.get("error_description") ?? errorParam;
        setErrorMessage(decodeURIComponent(desc.replace(/\+/g, " ")));
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
        // Step 1: Exchange code with Entra ID
        const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUri);

        // Step 2: Exchange Entra ID id_token for AWS token (best-effort)
        let awsToken: string | undefined;
        try {
          const awsRes = await fetch(
            `${AWS_APIS.TOKEN_EXCHANGE}/token-exchange`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokens.id_token}`,
              },
              body: JSON.stringify({ id_token: tokens.id_token }),
            }
          );
          if (awsRes.ok) {
            const awsData = (await awsRes.json()) as AwsTokenExchangeResponse;
            awsToken = awsData.token ?? awsData.access_token;
          }
        } catch {
          // AWS exchange is best-effort; don't block login
        }

        const session = buildSession(
          tokens.access_token,
          tokens.id_token,
          tokens.expires_in,
          awsToken
        );
        saveSession(session);

        navigate("/splash", { replace: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Authentication failed";
        setErrorMessage(msg);
        setStatus("error");
      }
    };

    handleCallback();
  }, [navigate]);

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
                Securely exchanging authorization tokens with Microsoft and AWS.
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
