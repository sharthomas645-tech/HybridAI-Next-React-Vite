"use client";

import { useCallback, useRef, useState } from "react";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/upload-config";

interface FileUploadProps {
  userEmail: string;
}

interface UploadRecord {
  id: string;
  fileName: string;
  caseId: string;
  status: "uploading" | "done" | "error";
  progress: number;
  errorMessage?: string;
  fileKey?: string;
  uploadedAt: string;
}

const DEMO_CASES = [
  { id: "C-2024-001", label: "C-2024-001 — John A. Smith" },
  { id: "C-2024-002", label: "C-2024-002 — Maria L. Garcia" },
  { id: "C-2024-003", label: "C-2024-003 — Robert J. Thompson" },
  { id: "C-2024-004", label: "C-2024-004 — Linda K. Patel" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FileUpload({ userEmail: _userEmail }: FileUploadProps) {
  const [caseId, setCaseId] = useState(DEMO_CASES[0].id);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const id = crypto.randomUUID();
      const record: UploadRecord = {
        id,
        fileName: file.name,
        caseId,
        status: "uploading",
        progress: 0,
        uploadedAt: new Date().toLocaleString(),
      };
      setUploads((prev) => [record, ...prev]);

      try {
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            caseId,
            fileSize: file.size,
          }),
        });

        if (!presignRes.ok) {
          const err = (await presignRes.json()) as { error?: string };
          throw new Error(err.error ?? "Failed to get upload URL");
        }

        const { uploadUrl, fileKey } = (await presignRes.json()) as {
          uploadUrl: string;
          fileKey: string;
        };

        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, progress: 20 } : u))
        );

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round(20 + (e.loaded / e.total) * 75);
              setUploads((prev) =>
                prev.map((u) => (u.id === id ? { ...u, progress: pct } : u))
              );
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`S3 upload failed: ${xhr.status}`));
          });
          xhr.addEventListener("error", () =>
            reject(new Error("Network error during upload"))
          );
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader(
            "Content-Type",
            file.type || "application/octet-stream"
          );
          xhr.send(file);
        });

        setUploads((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: "done", progress: 100, fileKey } : u
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: "error", errorMessage: msg } : u
          )
        );
      }
    },
    [caseId]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      for (const file of Array.from(files)) {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          alert(
            `File type not allowed: ${file.name}\nAllowed: ${ALLOWED_EXTENSIONS.join(", ")}`
          );
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          alert(
            `File too large: ${file.name} (${formatBytes(file.size)})\nMax: ${formatBytes(MAX_FILE_SIZE)}`
          );
          continue;
        }
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="case-selector-wrap">
        <label className="case-selector-label" htmlFor="upload-case-select">
          Select Case
        </label>
        <select
          id="upload-case-select"
          className="case-selector"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
        >
          {DEMO_CASES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          background: dragging
            ? "rgba(96,165,250,0.1)"
            : "rgba(10,20,50,0.5)",
          border: `2px dashed ${dragging ? "#60a5fa" : "rgba(100,160,255,0.25)"}`,
          borderRadius: "14px",
          padding: "3rem 2rem",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📤</div>
        <p
          style={{
            color: "var(--text-primary)",
            fontWeight: 600,
            marginBottom: "0.4rem",
          }}
        >
          Drag &amp; drop PHI files here, or click to browse
        </p>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.82rem",
            margin: 0,
          }}
        >
          Allowed: {ALLOWED_EXTENSIONS.join(", ")} · Max{" "}
          {formatBytes(MAX_FILE_SIZE)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(",")}
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploads.length > 0 && (
        <div
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "14px",
            overflow: "hidden",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            style={{
              padding: "0.85rem 1.25rem",
              borderBottom: "1px solid var(--glass-border)",
              fontWeight: 600,
              fontSize: "0.88rem",
              color: "var(--text-primary)",
            }}
          >
            Recent Uploads
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {uploads.map((u, i) => (
              <div
                key={u.id}
                style={{
                  padding: "0.85rem 1.25rem",
                  borderBottom:
                    i < uploads.length - 1
                      ? "1px solid rgba(100,160,255,0.08)"
                      : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {u.fileName}
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color:
                        u.status === "done"
                          ? "#22d3ee"
                          : u.status === "error"
                            ? "#f87171"
                            : "#a78bfa",
                    }}
                  >
                    {u.status === "done"
                      ? "✅ Uploaded"
                      : u.status === "error"
                        ? "❌ Failed"
                        : `⬆ ${u.progress}%`}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>Case: {u.caseId}</span>
                  <span>{u.uploadedAt}</span>
                </div>
                {u.status === "uploading" && (
                  <div
                    style={{
                      height: "3px",
                      background: "rgba(100,160,255,0.15)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${u.progress}%`,
                        background:
                          "linear-gradient(90deg, var(--blue-3), var(--aqua-2))",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                )}
                {u.status === "error" && u.errorMessage && (
                  <p className="error-message" style={{ margin: 0 }}>
                    {u.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
