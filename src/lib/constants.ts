/** AWS Lambda API endpoint constants */
export const AWS_APIS = {
  /** TokenExchangeAPI — Entra ID → AWS credential exchange */
  TOKEN_EXCHANGE:
    process.env.NEXT_PUBLIC_AWS_TOKEN_EXCHANGE_API ??
    "https://ld74izi7n6.execute-api.us-west-2.amazonaws.com/prod",

  /** AttorneyUploadAPI — document upload to S3 */
  UPLOAD:
    process.env.NEXT_PUBLIC_AWS_UPLOAD_API ??
    "https://vicwyv5xoi.execute-api.us-west-2.amazonaws.com/prod",

  /** BuildChronologyAPI — trigger chronology build */
  CHRONOLOGY:
    process.env.NEXT_PUBLIC_AWS_CHRONOLOGY_API ??
    "https://huy6splpn3.execute-api.us-west-2.amazonaws.com/prod",

  /** ExportCaseChronology-API — export built chronology */
  EXPORT:
    process.env.NEXT_PUBLIC_AWS_EXPORT_API ??
    "https://g4r3dpjiu9.execute-api.us-west-2.amazonaws.com/prod",

  /** RNVerificationRequest-API — submit for RN verification */
  VERIFICATION:
    process.env.NEXT_PUBLIC_AWS_VERIFICATION_API ??
    "https://rolkt59qj4.execute-api.us-west-2.amazonaws.com/prod",
} as const;

/** Allowed file extensions for PHI uploads */
export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".docx"];

/** Maximum upload file size (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
