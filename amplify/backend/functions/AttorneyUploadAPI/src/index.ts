import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// AWS Client
const REGION = process.env.REGION || "us-west-2";
const s3Client = new S3Client({ region: REGION });

const CORS_HEADERS = [
  "Content-Type",
  "Authorization",
  "x-amz-date",
  "x-amz-security-token",
  "x-amz-content-sha256",
  "x-amz-server-side-encryption",
].join(", ");

export const handler = async (event: {
  requestContext?: { http?: { method?: string } };
  httpMethod?: string;
  body?: string | Record<string, unknown> | null;
}) => {
  const ALLOWED_ORIGIN =
    process.env.FRONTEND_DOMAIN || "https://hybridaimedlegal.com";
  const BUCKET_NAME = process.env.BUCKET_NAME;
  const UPLOAD_PATH = process.env.VITE_UPLOAD_PREFIX || "uploads/";
  const REQUIRE_KMS = process.env.REQUIRE_KMS === "true";
  const KMS_KEY_ID = process.env.KMS_KEY_ID;
  const ALLOWED_EXTENSIONS = (process.env.ALLOWED_EXTENSIONS || "pdf")
    .split(",")
    .map((e: string) => e.trim().toLowerCase());
  const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "250", 10);
  const ENABLE_CASE_FOLDERS = process.env.ENABLE_CASE_FOLDERS === "true";

  const method =
    event.requestContext?.http?.method || event.httpMethod;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": CORS_HEADERS,
        "Access-Control-Max-Age": "3600",
      },
    };
  }

  // Validate environment variables
  if (!BUCKET_NAME) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
      },
      body: JSON.stringify({
        error: "Server Configuration Error",
        details: "BUCKET_NAME not configured",
      }),
    };
  }

  if (REQUIRE_KMS && !KMS_KEY_ID) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      },
      body: JSON.stringify({
        error: "Server Configuration Error",
        details: "KMS encryption required but KMS_KEY_ID not configured",
      }),
    };
  }

  // Parse body
  let body: { fileName?: string; caseId?: string; fileSizeMB?: number } = {};
  try {
    body =
      typeof event.body === "string"
        ? JSON.parse(event.body)
        : (event.body as {
            fileName?: string;
            caseId?: string;
            fileSizeMB?: number;
          }) || {};
  } catch (e) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      },
      body: JSON.stringify({
        error: "Invalid JSON in request body",
      }),
    };
  }

  const rawFileName = body.fileName || `PHI_${Date.now()}.pdf`;
  const rawCaseId = body.caseId || "general";
  const fileSizeMB = body.fileSizeMB || 0;

  // Validate file size
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      statusCode: 413,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      },
      body: JSON.stringify({
        error: "File Too Large",
        details: `Maximum file size is ${MAX_FILE_SIZE_MB}MB`,
      }),
    };
  }

  // Validate file extension
  const fileExtension = rawFileName.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      statusCode: 415,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      },
      body: JSON.stringify({
        error: "Invalid File Type",
        details: `Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed`,
      }),
    };
  }

  // Sanitize inputs to prevent path traversal and invalid S3 key characters
  const fileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const caseId = rawCaseId.replace(/[^a-zA-Z0-9_-]/g, "_");

  // Build S3 key with optional case folder structure
  const timestamp = Date.now();
  const key = ENABLE_CASE_FOLDERS
    ? `${UPLOAD_PATH}${caseId}/${timestamp}-${fileName}`
    : `${UPLOAD_PATH}${timestamp}-${fileName}`;


  // S3 Put Command with metadata
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: "application/pdf",
    ServerSideEncryption: REQUIRE_KMS ? "aws:kms" : "AES256",
    ...(REQUIRE_KMS && KMS_KEY_ID ? { SSEKMSKeyId: KMS_KEY_ID } : {}),
    Metadata: {
      "case-id": caseId,
      "uploaded-at": new Date(timestamp).toISOString(),
      "original-filename": fileName,
    },
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900,
    });


    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": CORS_HEADERS,
      },
      body: JSON.stringify({
        uploadUrl,
        url: uploadUrl,
        fileKey: key,
        key: key,
        bucket: BUCKET_NAME,
        expiresIn: 900,
        message: "Presigned URL generated successfully",
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
      },
      body: JSON.stringify({
        error: "Upload Initialization Failed",
        details: (err as Error).message,
      }),
    };
  }
};
