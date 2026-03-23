import { Navigate } from "react-router-dom";
import { getSession } from "@/lib/auth";
import AuroraBackground from "@/components/AuroraBackground";
import Header from "@/components/Header";
import VerificationClient from "./VerificationClient";

export default function VerificationPage() {
  const session = getSession();
  if (!session) return <Navigate to="/" replace />;

  return (
    <>
      <AuroraBackground />
      <Header user={{ username: session.username, email: session.email }} />
      <main
        style={{
          position: "relative",
          zIndex: 10,
          padding: "2rem 1.25rem",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          className="gradient-text-inline"
          style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}
        >
          RN Verification Dashboard
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.88rem",
            marginBottom: "2rem",
          }}
        >
          Submit cases for registered nurse medical record review and verification.
        </p>
        <VerificationClient />
      </main>
    </>
  );
}
