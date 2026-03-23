/**
 * Type-safe API client for AWS Lambda endpoints.
 * All calls go directly to the AWS Lambda APIs using the session token
 * from sessionStorage.
 */

import { getSession } from "./auth";
import { AWS_APIS, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "./constants";
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

function getAuthToken(): string {
  const session = getSession();
  if (!session) throw new ApiError(401, "Not authenticated");
  return session.awsToken ?? session.idToken;
}

async function post<TRequest, TResponse>(
  url: string,
  body: TRequest
): Promise<TResponse> {
  const token = getAuthToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, data.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<TResponse>;
}

/**
 * Upload a file directly to AWS AttorneyUploadAPI.
 * Returns the S3 file key.
 */
export async function uploadFile(
  file: File,
  caseId: string,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ApiError(400, `File type not allowed: ${ext}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(400, `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  return new Promise((resolve, reject) => {
    let token: string;
    try {
      token = getAuthToken();
    } catch (err) {
      reject(err);
      return;
    }

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

    xhr.open("PUT", `${AWS_APIS.UPLOAD}/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-case-id", caseId);
    xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    xhr.send(file);
  });
}

/** Trigger chronology build for an uploaded document */
export async function buildChronology(
  req: BuildChronologyRequest
): Promise<BuildChronologyResponse> {
  return post<BuildChronologyRequest, BuildChronologyResponse>(
    `${AWS_APIS.CHRONOLOGY}/build`,
    req
  );
}

/** Export a built chronology as PDF/document */
export async function exportChronology(
  req: ExportRequest
): Promise<ExportResponse> {
  return post<ExportRequest, ExportResponse>(`${AWS_APIS.EXPORT}/export`, req);
}

/** Submit a case for RN verification */
export async function requestRnVerification(
  req: RnVerificationRequest
): Promise<RnVerificationResponse> {
  return post<RnVerificationRequest, RnVerificationResponse>(
    `${AWS_APIS.VERIFICATION}/rn/request`,
    req
  );
}

export { ApiError };
