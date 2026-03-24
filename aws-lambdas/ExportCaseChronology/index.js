/**
 * ExportCaseChronology Lambda (ES Modules)
 *
 * - Exports case chronology data to S3
 * - Multi-tenant isolation by firmId
 * - KMS encryption (HIPAA)
 * - Strict CORS (restricted to Azure domain)
 * - Authorization via Entra ID firmId
 * - Content size validation (max 5MB)
 * - No PHI logging
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "crypto";

// ============= ENVIRONMENT VALIDATION =============

const REQUIRED_ENV_VARS = [
  "REGION",
  "BUCKET_NAME",
  "KMS_KEY_ID",
  "ALLOWED_ORIGIN",
  "REQUEST_TIMEOUT_MS",
  "MAX_EXPORT_SIZE"
];

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const {
  REGION,
  BUCKET_NAME,
  KMS_KEY_ID,
  ALLOWED_ORIGIN,
  REQUEST_TIMEOUT_MS,
  MAX_EXPORT_SIZE,
  EXPORT_EXPIRATION_SECONDS = "300"
} = process.env;

// Parse MAX_EXPORT_SIZE string (e.g. "5MB") into bytes
function parseSize(sizeStr) {
  const match = sizeStr.match(/^(\d+)(B|KB|MB|GB)$/i);
  if (!match) throw new Error(`Invalid MAX_EXPORT_SIZE format: ${sizeStr}`);
  const [, num, unit] = match;
  const multipliers = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  return parseInt(num, 10) * multipliers[unit.toUpperCase()];
}

const MAX_SIZE_BYTES = parseSize(MAX_EXPORT_SIZE);

// ============= AWS CLIENT =============

const s3 = new S3Client({ region: REGION });

// ============= CORS HEADERS =============

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "3600",
  "Access-Control-Expose-Headers": "Content-Type"
};

// ============= HELPER FUNCTIONS =============

function response(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
}

function validateId(value, name) {
  if (!value || typeof value !== "string") {
    throw new Error(`Invalid ${name}: must be a string`);
  }
  const regex = /^[a-zA-Z0-9\-_]{3,64}$/;
  if (!regex.test(value)) {
    throw new Error(`Invalid ${name}: must be 3-64 alphanumeric characters, hyphens, or underscores`);
  }
  return value;
}

function validateContent(content) {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new Error("content must be a non-null object");
  }
  const contentStr = JSON.stringify(content);
  const sizeInBytes = Buffer.byteLength(contentStr, "utf8");
  if (sizeInBytes > MAX_SIZE_BYTES) {
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    throw new Error(`Content exceeds maximum size of ${MAX_EXPORT_SIZE} (${sizeInMB}MB)`);
  }
  return content;
}

function safeJsonParse(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("invalid_json_payload");
  }
}

// ============= MAIN HANDLER =============

export const handler = async (event) => {
  console.log("[EXPORT_CASE_CHRONOLOGY] START", {
    requestId: event.requestContext?.requestId,
    method: event.httpMethod
  });

  try {
    // ---------- CORS PREFLIGHT ----------
    if (event.httpMethod === "OPTIONS") {
      console.log("[CORS] Preflight request");
      return { statusCode: 204, headers: corsHeaders, body: "" };
    }

    // ---------- PARSE REQUEST BODY ----------
    let body;
    try {
      body = safeJsonParse(event.body);
    } catch (e) {
      console.warn("[PARSE] Invalid JSON in request body");
      return response(400, {
        ok: false,
        error: "invalid_request_body",
        error_description: e.message
      });
    }

    // ---------- EXTRACT AUTHORIZATION ----------
    const authFirmId = event.requestContext?.authorizer?.firmId || null;

    if (!authFirmId) {
      console.warn("[AUTH] Missing firmId from authorizer");
      return response(401, {
        ok: false,
        error: "unauthorized"
      });
    }

    // ---------- EXTRACT PAYLOAD FIELDS ----------
    const { firmId, caseId, fileId, content } = body;

    // ---------- VERIFY FIRM ISOLATION ----------
    if (firmId !== authFirmId) {
      console.warn("[SECURITY] Firm ID mismatch", {
        requestFirmId: firmId,
        authFirmId
      });
      return response(403, {
        ok: false,
        error: "forbidden"
      });
    }

    // ---------- VALIDATE INPUT ----------
    try {
      validateId(firmId, "firmId");
      validateId(caseId, "caseId");
      validateId(fileId, "fileId");
      validateContent(content);
    } catch (validationError) {
      console.warn("[VALIDATE]", validationError.message);
      return response(400, {
        ok: false,
        error: "validation_error",
        error_description: validationError.message
      });
    }

    // ---------- BUILD IMMUTABLE S3 KEY ----------
    const exportedAt = new Date().toISOString();
    const timestamp = exportedAt.replace(/[:.]/g, "-");
    const exportHash = createHash("sha256")
      .update(`${firmId}-${caseId}-${fileId}-${timestamp}`)
      .digest("hex")
      .slice(0, 8);
    const s3Key = `${firmId}/${caseId}/exports/${fileId}-${exportHash}.json`;

    console.log("[STORE] Storing case chronology export", {
      firmId,
      caseId,
      fileId,
      s3Key,
      maxSize: MAX_EXPORT_SIZE
    });

    // ---------- WRITE TO S3 WITH KMS ENCRYPTION ----------
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: JSON.stringify(content, null, 2),
          ContentType: "application/json",
          ServerSideEncryption: "aws:kms",
          SSEKMSKeyId: KMS_KEY_ID,
          Metadata: {
            "firm-id": firmId,
            "case-id": caseId,
            "file-id": fileId,
            "export-type": "case-chronology",
            "exported-at": exportedAt
          }
        }),
        { requestTimeout: parseInt(REQUEST_TIMEOUT_MS, 10) }
      );

      console.log("[SUCCESS] Case chronology export stored", { s3Key, fileId });
    } catch (s3Error) {
      console.error("[S3_ERROR]", {
        message: s3Error.message,
        code: s3Error.code
      });
      return response(500, {
        ok: false,
        error: "storage_error"
      });
    }

    // ---------- RETURN SUCCESS ----------
    return response(200, {
      ok: true,
      firmId,
      caseId,
      fileId,
      s3Key,
      expiresIn: parseInt(EXPORT_EXPIRATION_SECONDS, 10),
      exportedAt
    });

  } catch (err) {
    console.error("[ERROR]", {
      message: err.message,
      code: err.code
    });

    // HIPAA-SAFE: Never expose internal errors
    return response(500, {
      ok: false,
      error: "internal_error"
    });
  }
};
