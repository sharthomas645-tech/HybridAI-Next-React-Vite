/**
 * Type-safe API client for AWS Lambda endpoints.
 * All calls are proxied through Next.js API routes (which add auth headers
 * from the server-side httpOnly session cookie).
 */

import type {
  BuildChronologyRequest,
  BuildChronologyResponse,
  ExportRequest,
  ExportResponse,
  RnVerificationRequest,
  RnVerificationResponse,
  UploadResponse,
} from "./types";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function post<TRequest, TResponse>(
  path: string,
  body: TRequest
): Promise<TResponse> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, data.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<TResponse>;
}

/**
 * Upload a file via the Next.js /api/upload proxy.
 * Returns the S3 file key.
 */
export async function uploadFile(
  file: File,
  caseId: string,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 95));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadResponse;
          onProgress?.(100);
          resolve(data);
        } catch {
          reject(new ApiError(xhr.status, "Invalid upload response"));
        }
      } else {
        let msg = `Upload failed: ${xhr.status}`;
        try {
          const err = JSON.parse(xhr.responseText) as { error?: string };
          if (err.error) msg = err.error;
        } catch { /* ignore */ }
        reject(new ApiError(xhr.status, msg));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new ApiError(0, "Network error during upload"))
    );

    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", caseId);
    formData.append("fileName", file.name);
    formData.append("contentType", file.type || "application/octet-stream");

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}

/** Trigger chronology build for an uploaded document */
export async function buildChronology(
  req: BuildChronologyRequest
): Promise<BuildChronologyResponse> {
  return post<BuildChronologyRequest, BuildChronologyResponse>("/api/build", req);
}

/** Export a built chronology as PDF/document */
export async function exportChronology(
  req: ExportRequest
): Promise<ExportResponse> {
  return post<ExportRequest, ExportResponse>("/api/export", req);
}

/** Submit a case for RN verification */
export async function requestRnVerification(
  req: RnVerificationRequest
): Promise<RnVerificationResponse> {
  return post<RnVerificationRequest, RnVerificationResponse>("/api/verify", req);
}

export { ApiError };
