"use client";

import { useState } from "react";
import { requestRnVerification } from "@/lib/api-client";
import type { RnVerificationResponse, CaseType } from "@/lib/types";

interface PendingCase {
  id: string;
  patientName: string;
  caseType: CaseType;
  dateOpened: string;
  lastUpdated: string;
  verificationStatus: "Pending" | "Submitted" | "In Review" | "Complete";
}

const DEMO_CASES: PendingCase[] = [
  {
    id: "C-2024-001",
    patientName: "John A. Smith",
    caseType: "Personal Injury",
    dateOpened: "2024-01-15",
    lastUpdated: "2024-03-10",
    verificationStatus: "Pending",
  },
  {
    id: "C-2024-002",
    patientName: "Maria L. Garcia",
    caseType: "Medical Malpractice",
    dateOpened: "2024-02-03",
    lastUpdated: "2024-03-08",
    verificationStatus: "In Review",
  },
  {
    id: "C-2024-003",
    patientName: "Robert J. Thompson",
    caseType: "Birth Injury",
    dateOpened: "2023-11-20",
    lastUpdated: "2024-03-12",
    verificationStatus: "Pending",
  },
  {
    id: "C-2024-004",
    patientName: "Linda K. Patel",
    caseType: "Medical Malpractice",
    dateOpened: "2024-01-28",
    lastUpdated: "2024-02-28",
    verificationStatus: "Submitted",
  },
];

const statusColors: Record<PendingCase["verificationStatus"], string> = {
  Pending: "#60a5fa",
  Submitted: "#a78bfa",
  "In Review": "#f59e0b",
  Complete: "#22d3ee",
};

export default function VerificationClient() {
  const [cases, setCases] = useState<PendingCase[]>(DEMO_CASES);
  const [selectedId, setSelectedId] = useState<string>(DEMO_CASES[0].id);
  const [notes, setNotes] = useState("");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [result, setResult] = useState<RnVerificationResponse | null>(null);
  const [error, setError] = useState("");

  const selectedCase = cases.find((c) => c.id === selectedId) ?? cases[0];

  const handleSubmit = async () => {
    setError("");
    setSubmitStatus("submitting");
    try {
      const res = await requestRnVerification({
        caseId: selectedCase.id,
        patientName: selectedCase.patientName,
        caseType: selectedCase.caseType,
        notes: notes.trim() || undefined,
      });
      setResult(res);
      setSubmitStatus("done");
      setCases((prev) =>
        prev.map((c) =>
          c.id === selectedCase.id
            ? { ...c, verificationStatus: "Submitted" }
            : c
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
      setSubmitStatus("error");
    }
  };

  const glass = {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    borderRadius: "14px",
    backdropFilter: "blur(14px)",
  } as React.CSSProperties;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "1.25rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)",
          gap: "1.25rem",
        }}
        className="verification-grid"
      >
        {/* Cases List */}
        <div style={{ ...glass, overflow: "hidden" }}>
          <div
            className="panel-header"
            style={{ padding: "1rem 1.25rem 0.75rem" }}
          >
            <h2 className="panel-title gradient-text-inline">Cases</h2>
          </div>
          <div
            className="cases-list"
            style={{ padding: "0.75rem", maxHeight: "480px", overflowY: "auto" }}
          >
            {cases.map((c) => {
              const color = statusColors[c.verificationStatus];
              return (
                <div
                  key={c.id}
                  className={`case-card ${selectedId === c.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedId(c.id);
                    setSubmitStatus("idle");
                    setResult(null);
                    setError("");
                  }}
                >
                  <div className="case-card-top">
                    <span className="case-id">{c.id}</span>
                    <span
                      className="case-status-badge"
                      style={{
                        background: `${color}1a`,
                        color,
                        border: `1px solid ${color}44`,
                      }}
                    >
                      {c.verificationStatus}
                    </span>
                  </div>
                  <div className="case-patient">{c.patientName}</div>
                  <div className="case-meta">
                    <span className="case-type-tag" style={{ color: "#60a5fa" }}>
                      {c.caseType}
                    </span>
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

        {/* Request Form */}
        <div style={{ ...glass, padding: "1.5rem" }}>
          <h2
            className="panel-title gradient-text-inline"
            style={{ marginBottom: "1.25rem" }}
          >
            Request RN Verification
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <p
                style={{
                  margin: "0 0 0.25rem",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                }}
              >
                Selected Case
              </p>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                }}
              >
                {selectedCase.patientName}
              </p>
              <p
                style={{
                  margin: "0.15rem 0 0",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                {selectedCase.id} · {selectedCase.caseType}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label
                htmlFor="rn-notes"
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                }}
              >
                Additional Notes (optional)
              </label>
              <textarea
                id="rn-notes"
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Any specific concerns or focus areas for the RN review…"
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            {error && (
              <p className="error-message" style={{ margin: 0 }}>
                {error}
              </p>
            )}

            {result && submitStatus === "done" && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "rgba(34,211,238,0.07)",
                  border: "1px solid rgba(34,211,238,0.25)",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  color: "var(--aqua-2)",
                }}
              >
                ✅ Request submitted! ID:{" "}
                <strong>{result.requestId}</strong> · Status:{" "}
                <strong>{result.status}</strong>
                {result.estimatedCompletion && (
                  <span> · Est. completion: {result.estimatedCompletion}</span>
                )}
              </div>
            )}

            <button
              className="action-btn action-rn"
              onClick={handleSubmit}
              disabled={
                submitStatus === "submitting" ||
                selectedCase.verificationStatus === "Complete"
              }
              style={{ justifyContent: "center" }}
            >
              {submitStatus === "submitting" ? (
                <span className="btn-loading">
                  <span className="spinner" /> Submitting…
                </span>
              ) : submitStatus === "done" ? (
                <>✅ Request Submitted</>
              ) : (
                <>🩺 Request RN Verification</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
