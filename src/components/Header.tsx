"use client";

import { useRouter } from "next/navigation";
import { buildLogoutUrl } from "@/lib/entra-auth";

interface HeaderProps {
  user: {
    username: string;
    email: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    window.location.href = buildLogoutUrl();
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  return (
    <nav
      style={{
        position: "relative",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        background: "var(--glass-bg)",
        borderBottom: "1px solid var(--glass-border)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Brand */}
      <button
        onClick={handleBack}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--text-primary)",
          fontSize: "1rem",
          fontWeight: 600,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="navLogoStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#7ff0ff" />
            </linearGradient>
          </defs>
          <polygon points="50,8 88,30 88,70 50,92 12,70 12,30" fill="rgba(255,255,255,0.1)" stroke="url(#navLogoStroke)" strokeWidth="2" />
          <g transform="translate(50,50)">
            <path d="M -15,-15 L -15,15 M 15,-15 L 15,15 M -15,0 L 15,0" stroke="url(#navLogoStroke)" strokeWidth="7" strokeLinecap="round" fill="none" />
          </g>
        </svg>
        <span className="gradient-text-inline">HybridAI</span>
      </button>

      {/* User info + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span
          style={{
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.email || user.username}
        </span>
        <button
          onClick={handleLogout}
          style={{
            background: "rgba(100,160,255,0.12)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: "0.8rem",
            padding: "0.35rem 0.85rem",
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
