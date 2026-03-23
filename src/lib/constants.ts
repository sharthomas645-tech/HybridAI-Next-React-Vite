/** AWS Lambda API endpoint constants */
export const AWS_APIS = {
  /** TokenExchangeAPI — Entra ID → AWS credential exchange */
  TOKEN_EXCHANGE:
    (import.meta.env["VITE_AWS_TOKEN_EXCHANGE_API"] as string | undefined) ??
    "https://ld74izi7n6.execute-api.us-west-2.amazonaws.com/prod",

  /** AttorneyUploadAPI — document upload to S3 */
  UPLOAD:
    (import.meta.env["VITE_AWS_UPLOAD_API"] as string | undefined) ??
    "https://vicwyv5xoi.execute-api.us-west-2.amazonaws.com/prod",

  /** BuildChronologyAPI — trigger chronology build */
  CHRONOLOGY:
    (import.meta.env["VITE_AWS_CHRONOLOGY_API"] as string | undefined) ??
    "https://huy6splpn3.execute-api.us-west-2.amazonaws.com/prod",

  /** ExportCaseChronology-API — export built chronology */
  EXPORT:
    (import.meta.env["VITE_AWS_EXPORT_API"] as string | undefined) ??
    "https://g4r3dpjiu9.execute-api.us-west-2.amazonaws.com/prod",

  /** RNVerificationRequest-API — submit for RN verification */
  VERIFICATION:
    (import.meta.env["VITE_AWS_VERIFICATION_API"] as string | undefined) ??
    "https://rolkt59qj4.execute-api.us-west-2.amazonaws.com/prod",
} as const;

/** Allowed file extensions for PHI uploads */
export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".docx"];

/** Maximum upload file size (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
