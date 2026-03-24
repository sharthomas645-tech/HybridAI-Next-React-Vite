"use strict";

/**
 * RNVerificationRequest Lambda
 *
 * - Receives RN verification requests from the React frontend
 * - Validates input (firmId, caseId, licensureNumbers)
 * - Stores requests to S3 with KMS encryption
 * - Multi-tenant isolation by firmId
 * - CORS restricted to Azure domain
 */

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");

// ============= ENVIRONMENT VALIDATION =============

const REQUIRED_ENV_VARS = [
  "REGION",
  "BUCKET_NAME",
  "KMS_KEY_ID",
  "ALLOWED_ORIGIN",
  "REQUEST_TIMEOUT_MS"
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
  REQUEST_TIMEOUT_MS
} = process.env;

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

function validateLicensureNumbers(licensureNumbers) {
  if (!Array.isArray(licensureNumbers) || licensureNumbers.length === 0) {
    throw new Error("licensureNumbers must be a non-empty array");
  }
  for (const num of licensureNumbers) {
    if (typeof num !== "string" || !/^[a-zA-Z0-9\-_]{1,32}$/.test(num)) {
      throw new Error(`Invalid licensure number: ${num}`);
    }
  }
  return licensureNumbers;
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

exports.handler = async (event) => {
  console.log("[RN_VERIFICATION_REQUEST] START", {
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
    const { firmId, caseId, licensureNumbers, notes } = body;

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
      validateLicensureNumbers(licensureNumbers);
    } catch (validationError) {
      console.warn("[VALIDATE]", validationError.message);
      return response(400, {
        ok: false,
        error: "validation_error",
        error_description: validationError.message
      });
    }

    // ---------- BUILD IMMUTABLE S3 KEY ----------
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const requestHash = crypto
      .createHash("sha256")
      .update(`${firmId}-${caseId}-${timestamp}`)
      .digest("hex")
      .slice(0, 8);
    const s3Key = `${firmId}/rn_verification_requests/${caseId}/${timestamp}-${requestHash}.json`;

    const requestPayload = {
      firmId,
      caseId,
      licensureNumbers,
      notes: notes || null,
      requestedAt: new Date().toISOString()
    };

    console.log("[STORE] Storing RN verification request", {
      firmId,
      caseId,
      s3Key
    });

    // ---------- WRITE TO S3 WITH KMS ENCRYPTION ----------
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: JSON.stringify(requestPayload, null, 2),
          ContentType: "application/json",
          ServerSideEncryption: "aws:kms",
          SSEKMSKeyId: KMS_KEY_ID,
          Metadata: {
            "firm-id": firmId,
            "case-id": caseId,
            "record-type": "rn-verification-request"
          }
        }),
        { requestTimeout: parseInt(REQUEST_TIMEOUT_MS, 10) }
      );

      console.log("[SUCCESS] RN verification request stored", { s3Key });
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
      s3Key,
      requestedAt: requestPayload.requestedAt
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
