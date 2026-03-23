"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { buildLogoutUrl } from "@/lib/entra-auth";

interface HeaderProps {
  user: { username: string; email: string };
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = buildLogoutUrl();
  };

  return (
    <nav className="dashboard-nav" style={{ position: "relative", zIndex: 10 }}>
      <div className="nav-brand">
        <img src="/hybridai.png" alt="HybridAI" className="nav-logo-img" />
        <span className="nav-separator">|</span>
        <span className="nav-subtitle">Medical Chronology &amp; Analyzer Intelligence</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link
          href="/dashboard"
          style={{
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            transition: "background 0.2s",
          }}
        >
          Dashboard
        </Link>
        <Link
          href="/upload"
          style={{
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            transition: "background 0.2s",
          }}
        >
          Upload Files
        </Link>
        <Link
          href="/chronology"
          style={{
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            transition: "background 0.2s",
          }}
        >
          Chronology
        </Link>
        <Link
          href="/verification"
          style={{
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            transition: "background 0.2s",
          }}
        >
          RN Verify
        </Link>
        <div className="nav-user">
          <span className="user-badge">{user.email || user.username}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
