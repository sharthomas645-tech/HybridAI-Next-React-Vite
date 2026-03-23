"use client";

import { useState, type FC } from "react";
import { useRouter } from "next/navigation";
import { buildLogoutUrl } from "@/lib/entra-auth";

type CaseType = "Personal Injury" | "Medical Malpractice" | "Birth Injury";
type CaseStatus = "Uploaded" | "Processing" | "RN Review in Progress" | "Ready for Export";

interface Case {
  id: string;
  patientName: string;
  caseType: CaseType;
  dateOpened: string;
  status: CaseStatus;
  lastUpdated: string;
  events: number;
}

interface DashboardProps {
  user: { username: string; email: string };
}

const DEMO_CASES: Case[] = [
  {
    id: "C-2024-001",
    patientName: "John A. Smith",
    caseType: "Personal Injury",
    dateOpened: "2024-01-15",
    status: "Ready for Export",
    lastUpdated: "2024-03-10",
    events: 12,
  },
  {
    id: "C-2024-002",
    patientName: "Maria L. Garcia",
    caseType: "Medical Malpractice",
    dateOpened: "2024-02-03",
    status: "RN Review in Progress",
    lastUpdated: "2024-03-08",
    events: 8,
  },
  {
    id: "C-2024-003",
    patientName: "Robert J. Thompson",
    caseType: "Birth Injury",
    dateOpened: "2023-11-20",
    status: "Processing",
    lastUpdated: "2024-03-12",
    events: 21,
  },
  {
    id: "C-2024-004",
    patientName: "Linda K. Patel",
    caseType: "Medical Malpractice",
    dateOpened: "2024-01-28",
    status: "Uploaded",
    lastUpdated: "2024-02-28",
    events: 15,
  },
];

const TIMELINE_EVENTS = [
  { date: "2024-03-12", label: "Medical records reviewed", type: "record" },
  { date: "2024-03-08", label: "Expert consultation scheduled", type: "consult" },
  { date: "2024-02-25", label: "Radiology reports uploaded", type: "upload" },
  { date: "2024-02-14", label: "Initial case assessment completed", type: "assessment" },
  { date: "2024-01-30", label: "Case file created", type: "create" },
];

const caseTypeColors: Record<CaseType, string> = {
  "Personal Injury": "#4a9eff",
  "Medical Malpractice": "#a855f7",
  "Birth Injury": "#38bdf8",
};

const statusConfig: Record<CaseStatus, { color: string; glow: string; icon: string }> = {
  "Uploaded":               { color: "#60a5fa", glow: "rgba(96,165,250,0.45)",  icon: "📄" },
  "Processing":             { color: "#a78bfa", glow: "rgba(167,139,250,0.45)", icon: "⚙️" },
  "RN Review in Progress":  { color: "#f59e0b", glow: "rgba(245,158,11,0.45)",  icon: "🩺" },
  "Ready for Export":       { color: "#22d3ee", glow: "rgba(34,211,238,0.45)",  icon: "✅" },
};

const CASE_TYPES: CaseType[] = ["Personal Injury", "Medical Malpractice", "Birth Injury"];

const Dashboard: FC<DashboardProps> = ({ user }) => {
  const router = useRouter();
  const [selectedCaseType, setSelectedCaseType] = useState<CaseType | "All">("All");
  const [selectedCaseId, setSelectedCaseId] = useState<string>(DEMO_CASES[0].id);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = buildLogoutUrl();
  };

  const filteredCases =
    selectedCaseType === "All"
      ? DEMO_CASES
      : DEMO_CASES.filter((c) => c.caseType === selectedCaseType);

  const activeCase = DEMO_CASES.find((c) => c.id === selectedCaseId) ?? DEMO_CASES[0];

  const metrics = {
    total:    DEMO_CASES.length,
    uploaded: DEMO_CASES.filter((c) => c.status === "Uploaded").length,
    processing: DEMO_CASES.filter((c) => c.status === "Processing").length,
    rnReview: DEMO_CASES.filter((c) => c.status === "RN Review in Progress").length,
    ready:    DEMO_CASES.filter((c) => c.status === "Ready for Export").length,
  };

  const actionButtons = [
    { label: "Upload PDF",        icon: "📤", cls: "action-btn action-upload",  onClick: () => router.push("/upload") },
    { label: "Build Chronology",  icon: "🗂️", cls: "action-btn action-build",   onClick: () => router.push("/chronology") },
    { label: "RN Review Request", icon: "🩺", cls: "action-btn action-rn",      onClick: () => router.push("/verification") },
    { label: "Export File",       icon: "📥", cls: "action-btn action-export",  onClick: () => router.push("/chronology") },
  ];

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <img src="/hybridai.png" alt="HybridAI" className="nav-logo-img" />
          <span className="nav-separator">|</span>
          <span className="nav-subtitle">Medical Chronology &amp; Analyzer Intelligence</span>
        </div>
        <div className="nav-user">
          <span className="user-badge">{user.email || user.username}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      <div className="dashboard-body">
        <div className="top-controls">
          <div className="case-selector-wrap">
            <label className="case-selector-label" htmlFor="case-select">Active Case</label>
            <select
              id="case-select"
              className="case-selector"
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
            >
              {DEMO_CASES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.patientName}
                </option>
              ))}
            </select>
          </div>

          <div className="action-buttons">
            {actionButtons.map((btn) => (
              <button key={btn.label} className={btn.cls} onClick={btn.onClick}>
                <span className="action-btn-icon">{btn.icon}</span>
                <span className="action-btn-label">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="metrics-bar">
          {[
            { label: "Total Cases",           value: metrics.total,      color: "#60a5fa", glow: "rgba(96,165,250,0.35)"  },
            { label: "Uploaded",              value: metrics.uploaded,   color: "#60a5fa", glow: "rgba(96,165,250,0.35)"  },
            { label: "Processing",            value: metrics.processing, color: "#a78bfa", glow: "rgba(167,139,250,0.35)" },
            { label: "RN Review in Progress", value: metrics.rnReview,   color: "#f59e0b", glow: "rgba(245,158,11,0.35)"  },
            { label: "Ready for Export",      value: metrics.ready,      color: "#22d3ee", glow: "rgba(34,211,238,0.35)"  },
          ].map((m) => (
            <div className="metric-card" key={m.label} style={{ "--metric-glow": m.glow } as React.CSSProperties}>
              <span className="metric-value" style={{ color: m.color }}>{m.value}</span>
              <span className="metric-label">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="dashboard-main">
          <div className="cases-panel">
            <div className="panel-header">
              <h2 className="panel-title gradient-text-inline">Case Management</h2>
              <div className="case-type-filters">
                <button
                  className={`filter-btn ${selectedCaseType === "All" ? "active" : ""}`}
                  onClick={() => setSelectedCaseType("All")}
                >
                  All
                </button>
                {CASE_TYPES.map((ct) => (
                  <button
                    key={ct}
                    className={`filter-btn ${selectedCaseType === ct ? "active" : ""}`}
                    onClick={() => setSelectedCaseType(ct)}
                    style={selectedCaseType === ct ? { borderColor: caseTypeColors[ct], color: caseTypeColors[ct] } : {}}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>

            <div className="cases-list">
              {filteredCases.map((c) => {
                const sc = statusConfig[c.status];
                return (
                  <div
                    key={c.id}
                    className={`case-card ${selectedCaseId === c.id ? "selected" : ""}`}
                    onClick={() => setSelectedCaseId(c.id)}
                  >
                    <div className="case-card-top">
                      <span className="case-id">{c.id}</span>
                      <span
                        className="case-status-badge"
                        style={{
                          background: `${sc.color}1a`,
                          color: sc.color,
                          border: `1px solid ${sc.color}44`,
                          boxShadow: `0 0 8px ${sc.glow}`,
                        }}
                      >
                        {sc.icon} {c.status}
                      </span>
                    </div>
                    <div className="case-patient">{c.patientName}</div>
                    <div className="case-meta">
                      <span className="case-type-tag" style={{ color: caseTypeColors[c.caseType] }}>
                        {c.caseType}
                      </span>
                      <span className="case-events">{c.events} events</span>
                    </div>
                    <div className="case-dates">
                      <span>Opened: {c.dateOpened}</span>
                      <span>Updated: {c.lastUpdated}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="timeline-panel">
            <div className="panel-header">
              <div className="timeline-panel-top">
                <div>
                  <h2 className="panel-title gradient-text-inline">
                    Chronology Timeline — {activeCase.id}
                  </h2>
                  <span className="case-patient-label">{activeCase.patientName}</span>
                </div>
                <span
                  className="case-status-badge case-status-lg"
                  style={{
                    background: `${statusConfig[activeCase.status].color}1a`,
                    color: statusConfig[activeCase.status].color,
                    border: `1px solid ${statusConfig[activeCase.status].color}44`,
                    boxShadow: `0 0 12px ${statusConfig[activeCase.status].glow}`,
                  }}
                >
                  {statusConfig[activeCase.status].icon} {activeCase.status}
                </span>
              </div>
            </div>
            <div className="timeline">
              {TIMELINE_EVENTS.map((ev, i) => (
                <div className="timeline-event" key={i}>
                  <div className="timeline-dot" />
                  <div className="timeline-line" />
                  <div className="timeline-content">
                    <span className="timeline-date">{ev.date}</span>
                    <span className="timeline-label">{ev.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
