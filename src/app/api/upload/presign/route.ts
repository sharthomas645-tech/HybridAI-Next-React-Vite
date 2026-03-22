import { NextRequest, NextResponse } from "next/server";
import { generatePresignedUploadUrl, MAX_FILE_SIZE } from "@/lib/s3";
import { getSession } from "@/lib/auth";

// Allow only safe MIME types for PHI file uploads
const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/tiff",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileName, contentType, caseId, fileSize } =
      (await request.json()) as {
        fileName: string;
        contentType: string;
        caseId: string;
        fileSize: number;
      };

    if (!fileName || !contentType || !caseId) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, contentType, caseId" },
        { status: 400 }
      );
    }

    if (
      typeof contentType !== "string" ||
      !ALLOWED_CONTENT_TYPES.includes(contentType.split(";")[0].trim())
    ) {
      return NextResponse.json(
        { error: "Content type not allowed" },
        { status: 400 }
      );
    }

    if (typeof fileSize === "number" && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size (${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    const result = await generatePresignedUploadUrl(
      fileName,
      contentType,
      caseId,
      session.email
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload initialization failed";
    console.error("Presign error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
