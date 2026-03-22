import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "./upload-config";

const REGION = process.env.AWS_REGION ?? "us-west-2";
const BUCKET_NAME = process.env.S3_BUCKET_NAME ?? "";
const UPLOAD_PREFIX = process.env.S3_UPLOAD_PREFIX ?? "phi-uploads/";
const KMS_KEY_ID = process.env.KMS_KEY_ID ?? "";
const PRESIGNED_URL_EXPIRES = 900; // 15 minutes

const s3Client = new S3Client({ region: REGION });

export function validateFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return false;
  }
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export interface PresignedUrlResult {
  uploadUrl: string;
  fileKey: string;
  bucket: string;
  expiresIn: number;
}

/** Generate a presigned S3 PUT URL for direct browser upload (server-side only) */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  caseId: string,
  userEmail: string
): Promise<PresignedUrlResult> {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is not set");
  }

  if (!validateFileName(fileName)) {
    throw new Error(`File type not allowed: ${fileName}`);
  }

  const safe = sanitizeFileName(fileName);
  const fileKey = `${UPLOAD_PREFIX}${caseId}/${randomUUID()}_${safe}`;

  const commandParams: {
    Bucket: string;
    Key: string;
    ContentType: string;
    Metadata: Record<string, string>;
    ServerSideEncryption?: "aws:kms" | "AES256";
    SSEKMSKeyId?: string;
  } = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
    Metadata: {
      "uploaded-by": userEmail,
      "case-id": caseId,
      "original-name": safe,
    },
    ServerSideEncryption: KMS_KEY_ID ? "aws:kms" : "AES256",
  };

  if (KMS_KEY_ID) {
    commandParams.SSEKMSKeyId = KMS_KEY_ID;
  }

  const command = new PutObjectCommand(commandParams);
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRES,
  });

  return {
    uploadUrl,
    fileKey,
    bucket: BUCKET_NAME,
    expiresIn: PRESIGNED_URL_EXPIRES,
  };
}

export { MAX_FILE_SIZE, ALLOWED_EXTENSIONS };
