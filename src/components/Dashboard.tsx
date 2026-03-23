"use client";

import { useState, type FC } from "react";
import { useRouter } from "next/navigation";
import { buildLogoutUrl } from "@/lib/entra-auth";

type CaseType = "Personal Injury" | "Medical Malpractice" | "Birth Injury";
type CaseStatus = "Uploaded" | "Processing" | "RN Review in Progress" | "Ready for Export";
type AlertSeverity = "critical" | "warning" | "info";

interface Case {
  id: string;
  patientName: string;
  caseType: CaseType;
  dateOpened: string;
  status: CaseStatus;
  lastUpdated: string;
  events: number;
  fileCount: number;
}

interface CaseFile {
  id: string;
  caseId: string;
  name: string;
  uploadDate: string;
  size: string;
  status: CaseStatus;
}

interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  icon: string;
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
    fileCount: 3,
  },
  {
    id: "C-2024-002",
    patientName: "Maria L. Garcia",
    caseType: "Medical Malpractice",
    dateOpened: "2024-02-03",
    status: "RN Review in Progress",
    lastUpdated: "2024-03-08",
    events: 8,
    fileCount: 2,
  },
  {
    id: "C-2024-003",
    patientName: "Robert J. Thompson",
    caseType: "Birth Injury",
    dateOpened: "2023-11-20",
    status: "Processing",
    lastUpdated: "2024-03-12",
    events: 21,
    fileCount: 5,
  },
  {
    id: "C-2024-004",
    patientName: "Linda K. Patel",
    caseType: "Medical Malpractice",
    dateOpened: "2024-01-28",
    status: "Uploaded",
    lastUpdated: "2024-02-28",
    events: 15,
    fileCount: 4,
  },
];

const DEMO_FILES: CaseFile[] = [
  { id: "F-001", caseId: "C-2024-001", name: "Medical_Records_Smith.pdf",    uploadDate: "2024-01-16", size: "4.2 MB",  status: "Ready for Export" },
  { id: "F-002", caseId: "C-2024-001", name: "Radiology_Reports_Smith.pdf",  uploadDate: "2024-02-10", size: "12.8 MB", status: "Ready for Export" },
  { id: "F-003", caseId: "C-2024-001", name: "Expert_Opinion_Smith.docx",    uploadDate: "2024-03-05", size: "1.1 MB",  status: "Ready for Export" },
  { id: "F-004", caseId: "C-2024-002", name: "Hospital_Records_Garcia.pdf",  uploadDate: "2024-02-04", size: "8.5 MB",  status: "RN Review in Progress" },
  { id: "F-005", caseId: "C-2024-002", name: "Lab_Results_Garcia.pdf",       uploadDate: "2024-02-20", size: "2.3 MB",  status: "RN Review in Progress" },
  { id: "F-006", caseId: "C-2024-003", name: "Birth_Records_Thompson.pdf",   uploadDate: "2023-11-21", size: "6.7 MB",  status: "Processing" },
  { id: "F-007", caseId: "C-2024-003", name: "NICU_Records_Thompson.pdf",    uploadDate: "2023-12-15", size: "9.2 MB",  status: "Processing" },
  { id: "F-008", caseId: "C-2024-003", name: "Expert_Report_Thompson.pdf",   uploadDate: "2024-01-08", size: "3.1 MB",  status: "Processing" },
  { id: "F-009", caseId: "C-2024-003", name: "Imaging_Thompson.pdf",         uploadDate: "2024-02-01", size: "18.4 MB", status: "Processing" },
  { id: "F-010", caseId: "C-2024-003", name: "Treatment_Notes_Thompson.pdf", uploadDate: "2024-03-01", size: "1.8 MB",  status: "Processing" },
  { id: "F-011", caseId: "C-2024-004", name: "Surgery_Records_Patel.pdf",    uploadDate: "2024-01-29", size: "5.6 MB",  status: "Uploaded" },
  { id: "F-012", caseId: "C-2024-004", name: "Post_Op_Notes_Patel.pdf",      uploadDate: "2024-02-05", size: "2.0 MB",  status: "Uploaded" },
  { id: "F-013", caseId: "C-2024-004", name: "Pathology_Reports_Patel.pdf",  uploadDate: "2024-02-15", size: "3.4 MB",  status: "Uploaded" },
  { id: "F-014", caseId: "C-2024-004", name: "MRI_Scans_Patel.pdf",          uploadDate: "2024-02-20", size: "22.1 MB", status: "Uploaded" },
];

const INITIAL_ALERTS: Alert[] = [
  {
    id: "A-001",
    severity: "critical",
    title: "2 Cases Overdue",
    message: "Cases C-2024-003 and C-2024-004 have exceeded standard processing timelines.",
    icon: "🚨",
  },
  {
    id: "A-002",
    severity: "critical",
    title: "RN Review Pending",
    message: "Case C-2024-002 (Maria L. Garcia) has been awaiting RN review for 14 days.",
    icon: "⚠️",
  },
  {
    id: "A-003",
    severity: "warning",
    title: "Export Ready",
    message: "Case C-2024-001 (John A. Smith) is ready for final export and delivery.",
    icon: "📋",
  },
];

const TIMELINE_EVENTS = [
  { date: "2024-03-12", label: "Medical records reviewed",          type: "record" },
  { date: "2024-03-08", label: "Expert consultation scheduled",     type: "consult" },
  { date: "2024-02-25", label: "Radiology reports uploaded",        type: "upload" },
  { date: "2024-02-14", label: "Initial case assessment completed", type: "assessment" },
  { date: "2024-01-30", label: "Case file created",                 type: "create" },
];

const caseTypeColors: Record<CaseType, string> = {
  "Personal Injury":    "#4a9eff",
  "Medical Malpractice": "#a855f7",
  "Birth Injury":       "#38bdf8",
};

const statusConfig: Record<CaseStatus, { color: string; glow: string; icon: string }> = {
  "Uploaded":              { color: "#60a5fa", glow: "rgba(96,165,250,0.45)",  icon: "📄" },
  "Processing":            { color: "#a78bfa", glow: "rgba(167,139,250,0.45)", icon: "⚙️" },
  "RN Review in Progress": { color: "#f59e0b", glow: "rgba(245,158,11,0.45)",  icon: "🩺" },
  "Ready for Export":      { color: "#22d3ee", glow: "rgba(34,211,238,0.45)",  icon: "✅" },
};

const CASE_TYPES: CaseType[] = ["Personal Injury", "Medical Malpractice", "Birth Injury"];

const metricConfig = [
  { key: "total" as const,      label: "Total Cases",     color: "#60a5fa", glow: "rgba(96,165,250,0.35)",   icon: "📁" },
  { key: "uploaded" as const,   label: "Uploaded",        color: "#60a5fa", glow: "rgba(96,165,250,0.35)",   icon: "📤" },
  { key: "processing" as const, label: "Processing",      color: "#a78bfa", glow: "rgba(167,139,250,0.35)",  icon: "⚙️" },
  { key: "rnReview" as const,   label: "RN Review",       color: "#f59e0b", glow: "rgba(245,158,11,0.35)",   icon: "🩺" },
  { key: "ready" as const,      label: "Ready to Export", color: "#22d3ee", glow: "rgba(34,211,238,0.35)",   icon: "✅" },
];

const Dashboard: FC<DashboardProps> = ({ user }) => {
  const router = useRouter();
  const [selectedCaseType, setSelectedCaseType] = useState<CaseType | "All">("All");
  const [selectedCaseId, setSelectedCaseId]     = useState<string>(DEMO_CASES[0].id);
  const [alerts, setAlerts]                     = useState<Alert[]>(INITIAL_ALERTS);
  const [expandedCaseId, setExpandedCaseId]     = useState<string | null>(null);
  const [now]                                   = useState(() => new Date());

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = buildLogoutUrl();
  };

  const dismissAlert = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  const pluralize = (count: number, singular: string, plural: string) =>
    `${count} ${count === 1 ? singular : plural}`;

  const filteredCases =
    selectedCaseType === "All"
      ? DEMO_CASES
      : DEMO_CASES.filter((c) => c.caseType === selectedCaseType);

  const activeCase      = DEMO_CASES.find((c) => c.id === selectedCaseId) ?? DEMO_CASES[0];
  const activeCaseFiles = DEMO_FILES.filter((f) => f.caseId === selectedCaseId);

  const metrics = {
    total:      DEMO_CASES.length,
    uploaded:   DEMO_CASES.filter((c) => c.status === "Uploaded").length,
    processing: DEMO_CASES.filter((c) => c.status === "Processing").length,
    rnReview:   DEMO_CASES.filter((c) => c.status === "RN Review in Progress").length,
    ready:      DEMO_CASES.filter((c) => c.status === "Ready for Export").length,
  };

  const dateStr     = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const displayName = (user.email?.split("@")[0]?.trim() || user.username || "Attorney");

  return (
    <div className="dashboard-container">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <img src="/hybridai.png" alt="HybridAI" className="nav-logo-img" />
          <span className="nav-separator">|</span>
          <span className="nav-subtitle">Medical Chronology &amp; Analyzer Intelligence</span>
        </div>
        <div className="nav-user">
          <span className="nav-date">{dateStr}</span>
          <span className="user-badge">{user.email || user.username}</span>
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      {/* ── High Risk Alerts ────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert-card alert-${alert.severity}`}>
              <span className="alert-icon">{alert.icon}</span>
              <div className="alert-body">
                <span className="alert-title">{alert.title}</span>
                <span className="alert-msg">{alert.message}</span>
              </div>
              <button
                className="alert-dismiss"
                onClick={() => dismissAlert(alert.id)}
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-body">

        {/* ── Welcome Header ──────────────────────────────────────── */}
        <div className="welcome-header">
          <div>
            <h1 className="welcome-title">
              Welcome back,&nbsp;<span className="gradient-text-inline">{displayName}</span>
            </h1>
            <p className="welcome-sub">Here&apos;s your case management overview for today.</p>
          </div>
          <div className="welcome-stats">
            <span className="welcome-stat">
              <span className="welcome-stat-val" style={{ color: "#f87171" }}>
                {alerts.filter((a) => a.severity === "critical").length}
              </span>
              <span className="welcome-stat-lbl">Critical Alerts</span>
            </span>
            <span className="welcome-stat">
              <span className="welcome-stat-val" style={{ color: "#22d3ee" }}>
                {metrics.ready}
              </span>
              <span className="welcome-stat-lbl">Ready to Export</span>
            </span>
            <span className="welcome-stat">
              <span className="welcome-stat-val" style={{ color: "#60a5fa" }}>
                {metrics.total}
              </span>
              <span className="welcome-stat-lbl">Total Cases</span>
            </span>
          </div>
        </div>

        {/* ── Metrics Bar ─────────────────────────────────────────── */}
        <div className="metrics-bar">
          {metricConfig.map((m) => (
            <div
              className="metric-card"
              key={m.key}
              style={{ "--metric-glow": m.glow } as React.CSSProperties}
            >
              <span className="metric-icon">{m.icon}</span>
              <span className="metric-value" style={{ color: m.color }}>{metrics[m.key]}</span>
              <span className="metric-label">{m.label}</span>
            </div>
          ))}
        </div>

        {/* ── Action Buttons ──────────────────────────────────────── */}
        <div className="action-buttons-row">
          <button className="action-btn-lg action-upload" onClick={() => router.push("/upload")}>
            <span className="action-btn-lg-icon">📤</span>
            <span className="action-btn-lg-label">Upload Files</span>
          </button>
          <button className="action-btn-lg action-build" onClick={() => router.push("/chronology")}>
            <span className="action-btn-lg-icon">🗂️</span>
            <span className="action-btn-lg-label">Build Chronology</span>
          </button>
          <button className="action-btn-lg action-rn" onClick={() => router.push("/verification")}>
            <span className="action-btn-lg-icon">🩺</span>
            <span className="action-btn-lg-label">Request RN Review</span>
          </button>
          <button className="action-btn-lg action-export" onClick={() => router.push("/chronology")}>
            <span className="action-btn-lg-icon">📥</span>
            <span className="action-btn-lg-label">Export Case</span>
          </button>
        </div>

        {/* ── Main Grid ───────────────────────────────────────────── */}
        <div className="dashboard-main">

          {/* ── Cases Panel ─────────────────────────────────────── */}
          <div className="cases-panel">
            <div className="panel-header">
              <div className="panel-header-row">
                <h2 className="panel-title gradient-text-inline">Case Management</h2>
                <span className="case-count-badge">{filteredCases.length} cases</span>
              </div>
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
                const sc         = statusConfig[c.status];
                const isExpanded = expandedCaseId === c.id;
                const cFiles     = DEMO_FILES.filter((f) => f.caseId === c.id);
                return (
                  <div key={c.id} className="case-card-wrapper">
                    <div
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
                      <button
                        className="case-files-toggle"
                        style={{ color: sc.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCaseId(isExpanded ? null : c.id);
                        }}
                      >
                        <span>{pluralize(c.fileCount, "file", "files")}</span>
                        <span className={`toggle-chevron ${isExpanded ? "open" : ""}`}>▾</span>
                      </button>
                    </div>

                    {/* ── Case Files Dropdown ─────────────────── */}
                    {isExpanded && (
                      <div className="case-files-dropdown">
                        <div className="case-files-header">Case Files</div>
                        {cFiles.map((f) => {
                          const fsc = statusConfig[f.status];
                          return (
                            <div className="case-file-item" key={f.id}>
                              <span className="file-doc-icon">📄</span>
                              <div className="file-info">
                                <span className="file-name">{f.name}</span>
                                <span className="file-meta">{f.uploadDate} · {f.size}</span>
                              </div>
                              <span
                                className="file-status-dot"
                                title={f.status}
                                style={{ background: fsc.color, boxShadow: `0 0 6px ${fsc.glow}` }}
                              />
                              <div className="file-actions">
                                <button className="file-action-btn">View</button>
                                <button className="file-action-btn">↓</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Timeline Panel ──────────────────────────────────── */}
          <div className="timeline-panel">
            <div className="panel-header">
              <div className="timeline-panel-top">
                <div>
                  <h2 className="panel-title gradient-text-inline">
                    Chronology — {activeCase.id}
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

            {/* Active case files ─────────────────────────────── */}
            <div className="active-case-files">
              <div className="active-files-header">
                <span>Case Files ({activeCaseFiles.length})</span>
                <button className="add-file-btn" onClick={() => router.push("/upload")}>
                  + Add File
                </button>
              </div>
              <div className="active-files-list">
                {activeCaseFiles.map((f) => {
                  const fsc = statusConfig[f.status];
                  return (
                    <div className="active-file-row" key={f.id}>
                      <span className="active-file-doc-icon">📄</span>
                      <div className="active-file-info">
                        <span className="active-file-name">{f.name}</span>
                        <span className="active-file-size">{f.uploadDate} · {f.size}</span>
                      </div>
                      <span
                        className="file-status-dot"
                        title={f.status}
                        style={{ background: fsc.color, boxShadow: `0 0 6px ${fsc.glow}` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline events ───────────────────────────────── */}
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
