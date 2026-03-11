import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// AWS Client
const REGION = process.env.REGION || "us-west-2";
const s3Client = new S3Client({ region: REGION });

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

  const method =
    event.requestContext?.http?.method || event.httpMethod;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, x-amz-server-side-encryption, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    };
  }

  // Validate environment variables
  if (!BUCKET_NAME) {
    console.error("BUCKET_NAME environment variable is not set");
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

  // Parse body
  let body: { fileName?: string; caseId?: string } = {};
  try {
    body =
      typeof event.body === "string"
        ? JSON.parse(event.body)
        : (event.body as { fileName?: string; caseId?: string }) || {};
  } catch (e) {
    console.error("JSON Parse Error:", e);
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

  // Sanitize inputs to prevent path traversal and invalid S3 key characters
  const rawFileName = body.fileName || `PHI_${Date.now()}.pdf`;
  const rawCaseId = body.caseId || "general";
  const fileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const caseId = rawCaseId.replace(/[^a-zA-Z0-9_-]/g, "_");

  // S3 Key
  const key = `${UPLOAD_PATH}${caseId}/${Date.now()}-${fileName}`;

  console.log(`Generating presigned URL for: s3://${BUCKET_NAME}/${key}`);

  // S3 Put Command
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: "application/pdf",
    ServerSideEncryption: REQUIRE_KMS ? "aws:kms" : "AES256",
    ...(REQUIRE_KMS && KMS_KEY_ID ? { SSEKMSKeyId: KMS_KEY_ID } : {}),
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900,
    });

    console.log(`Presigned URL generated successfully for key: ${key}`);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, x-amz-server-side-encryption, Authorization",
      },
      body: JSON.stringify({
        uploadUrl,
        url: uploadUrl,
        fileKey: key,
        key: key,
        bucket: BUCKET_NAME,
        expiresIn: 900,
      }),
    };
  } catch (err) {
    console.error("S3 Error:", err);
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
