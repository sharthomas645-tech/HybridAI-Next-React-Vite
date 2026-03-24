"use client";

import { useState } from "react";
import { buildChronology, exportChronology } from "@/lib/api-client";
import type { BuildChronologyResponse, ExportResponse } from "@/lib/types";

const DEMO_CASES = [
  { id: "C-2024-001", label: "C-2024-001 — John A. Smith", fileKey: "phi-uploads/C-2024-001/records.pdf" },
  { id: "C-2024-002", label: "C-2024-002 — Maria L. Garcia", fileKey: "phi-uploads/C-2024-002/records.pdf" },
  { id: "C-2024-003", label: "C-2024-003 — Robert J. Thompson", fileKey: "phi-uploads/C-2024-003/records.pdf" },
  { id: "C-2024-004", label: "C-2024-004 — Linda K. Patel", fileKey: "phi-uploads/C-2024-004/records.pdf" },
];

const DEMO_EVENTS = [
  { date: "2024-03-12", label: "Medical records reviewed", type: "record" as const },
  { date: "2024-03-08", label: "Expert consultation scheduled", type: "consult" as const },
  { date: "2024-02-25", label: "Radiology reports uploaded", type: "upload" as const },
  { date: "2024-02-14", label: "Initial case assessment completed", type: "assessment" as const },
  { date: "2024-01-30", label: "Case file created", type: "create" as const },
];

export default function ChronologyClient() {
  const [selectedCase, setSelectedCase] = useState(DEMO_CASES[0]);
  const [buildStatus, setBuildStatus] = useState<"idle" | "building" | "done" | "error">("idle");
  const [chronologyResult, setChronologyResult] = useState<BuildChronologyResponse | null>(null);
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "done" | "error">("idle");
  const [exportResult, setExportResult] = useState<ExportResponse | null>(null);
  const [error, setError] = useState("");

  const handleBuild = async () => {
    setError("");
    setBuildStatus("building");
    try {
      const result = await buildChronology({
        caseId: selectedCase.id,
        fileKey: selectedCase.fileKey,
      });
      setChronologyResult(result);
      setBuildStatus("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Build failed";
      setError(msg);
      setBuildStatus("error");
    }
  };

  const handleExport = async () => {
    if (!chronologyResult) return;
    setError("");
    setExportStatus("exporting");
    try {
      const result = await exportChronology({
        caseId: selectedCase.id,
        chronologyId: chronologyResult.chronologyId,
        format: "pdf",
      });
      setExportResult(result);
      setExportStatus("done");
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setError(msg);
      setExportStatus("error");
    }
  };

  const glass = {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    borderRadius: "14px",
    backdropFilter: "blur(14px)",
    padding: "1.5rem",
  } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Case Selector */}
      <div style={glass}>
        <div className="case-selector-wrap" style={{ maxWidth: "420px" }}>
          <label className="case-selector-label" htmlFor="chron-case-select">
            Select Case
          </label>
          <select
            id="chron-case-select"
            className="case-selector"
            value={selectedCase.id}
            onChange={(e) => {
              const c = DEMO_CASES.find((x) => x.id === e.target.value) ?? DEMO_CASES[0];
              setSelectedCase(c);
              setBuildStatus("idle");
              setChronologyResult(null);
              setExportStatus("idle");
              setExportResult(null);
              setError("");
            }}
          >
            {DEMO_CASES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Build Action */}
      <div style={glass}>
        <h2
          className="panel-title gradient-text-inline"
          style={{ marginBottom: "1rem" }}
        >
          Build Chronology
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          Trigger AI-powered chronology generation for{" "}
          <strong style={{ color: "var(--text-primary)" }}>{selectedCase.label}</strong>.
        </p>
        {error && <p className="error-message" style={{ marginBottom: "1rem" }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            className="action-btn action-build"
            onClick={handleBuild}
            disabled={buildStatus === "building"}
            style={{ minWidth: "180px", justifyContent: "center" }}
          >
            {buildStatus === "building" ? (
              <span className="btn-loading"><span className="spinner" /> Building…</span>
            ) : buildStatus === "done" ? (
              <>✅ Rebuild Chronology</>
            ) : (
              <>🗂️ Build Chronology</>
            )}
          </button>

          {chronologyResult && (
            <button
              className="action-btn action-export"
              onClick={handleExport}
              disabled={exportStatus === "exporting"}
              style={{ minWidth: "160px", justifyContent: "center" }}
            >
              {exportStatus === "exporting" ? (
                <span className="btn-loading"><span className="spinner" /> Exporting…</span>
              ) : exportStatus === "done" ? (
                <>✅ Download Again</>
              ) : (
                <>📥 Export as PDF</>
              )}
            </button>
          )}
        </div>

        {chronologyResult && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1rem",
              background: "rgba(34,211,238,0.07)",
              border: "1px solid rgba(34,211,238,0.25)",
              borderRadius: "8px",
              fontSize: "0.82rem",
              color: "var(--aqua-2)",
            }}
          >
            Chronology ID:{" "}
            <strong>{chronologyResult.chronologyId}</strong> · Status:{" "}
            <strong>{chronologyResult.status}</strong>
            {chronologyResult.message && (
              <span> · {chronologyResult.message}</span>
            )}
          </div>
        )}

        {exportResult?.downloadUrl && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem 1rem",
              background: "rgba(96,165,250,0.07)",
              border: "1px solid rgba(96,165,250,0.25)",
              borderRadius: "8px",
              fontSize: "0.82rem",
              color: "var(--blue-3)",
            }}
          >
            Export ready:{" "}
            <a
              href={exportResult.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--aqua-2)", textDecoration: "underline" }}
            >
              {exportResult.fileName || "Download file"}
            </a>
          </div>
        )}
      </div>

      {/* Timeline Preview */}
      <div style={{ ...glass, padding: "0" }}>
        <div
          className="panel-header"
          style={{ padding: "1rem 1.25rem 0.75rem" }}
        >
          <h2 className="panel-title gradient-text-inline">
            Chronology Timeline — {selectedCase.id}
          </h2>
        </div>
        <div className="timeline" style={{ padding: "1rem 1.25rem" }}>
          {DEMO_EVENTS.map((ev, i) => (
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
  );
}
