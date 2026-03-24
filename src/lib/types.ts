// TypeScript types for HybridAI MedLegal application
// Covers Entra ID tokens, AWS APIs, cases, chronology, and RN verification

// ─── Entra ID / Auth ───────────────────────────────────────────────────────

export interface EntraIdUser {
  oid: string;          // Object ID (unique user identifier)
  email: string;        // upn / preferred_username
  name: string;         // Display name
  given_name?: string;
  family_name?: string;
  tid: string;          // Tenant ID
}

/** AWS credentials returned by the token exchange Lambda */
export interface AwsCredentials {
  /** Bearer token for calling AWS Lambda APIs */
  token: string;
  expiresIn: number;
}

// ─── Upload API ────────────────────────────────────────────────────────────

export interface UploadRequest {
  fileName: string;
  contentType: string;
  caseId: string;
  fileSize: number;
}

export interface UploadResponse {
  /** S3 key or document reference returned by the Lambda */
  fileKey: string;
  message?: string;
}

// ─── Build Chronology API ─────────────────────────────────────────────────

export interface BuildChronologyRequest {
  caseId: string;
  fileKey: string;
}

export interface BuildChronologyResponse {
  chronologyId: string;
  status: "queued" | "processing" | "complete" | "error";
  message?: string;
}

// ─── Export API ───────────────────────────────────────────────────────────

export interface ExportRequest {
  caseId: string;
  chronologyId: string;
  format?: "pdf" | "docx";
}

export interface ExportResponse {
  downloadUrl: string;
  fileName: string;
  expiresAt?: string;
}

// ─── RN Verification API ──────────────────────────────────────────────────

export interface RnVerificationRequest {
  caseId: string;
  patientName: string;
  caseType: string;
  notes?: string;
}

export interface RnVerificationResponse {
  requestId: string;
  status: "submitted" | "pending" | "in_review" | "complete";
  message?: string;
  estimatedCompletion?: string;
}

// ─── Case / Chronology data ───────────────────────────────────────────────

export type CaseType = "Personal Injury" | "Medical Malpractice" | "Birth Injury";
export type CaseStatus =
  | "Uploaded"
  | "Processing"
  | "RN Review in Progress"
  | "Ready for Export";

export interface Case {
  id: string;
  patientName: string;
  caseType: CaseType;
  dateOpened: string;
  status: CaseStatus;
  lastUpdated: string;
  events: number;
  /** S3 file key of the uploaded document */
  fileKey?: string;
  /** Chronology ID after build completes */
  chronologyId?: string;
}

export interface TimelineEvent {
  date: string;
  label: string;
  type: "record" | "consult" | "upload" | "assessment" | "create" | "export";
}

export interface Chronology {
  id: string;
  caseId: string;
  status: BuildChronologyResponse["status"];
  events: TimelineEvent[];
  builtAt?: string;
}

// ─── Upload record (client state) ────────────────────────────────────────

export interface UploadRecord {
  id: string;
  fileName: string;
  caseId: string;
  status: "uploading" | "done" | "error";
  progress: number;
  errorMessage?: string;
  fileKey?: string;
  uploadedAt: string;
}

// ─── PKCE ────────────────────────────────────────────────────────────────

export type { PKCEPair } from "./entra-auth";
