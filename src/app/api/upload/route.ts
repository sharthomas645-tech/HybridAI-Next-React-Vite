import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AWS_APIS, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/constants";

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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caseId = formData.get("caseId") as string | null;

    if (!file || !caseId) {
      return NextResponse.json(
        { error: "Missing required fields: file, caseId" },
        { status: 400 }
      );
    }

    const contentType = file.type || "application/octet-stream";
    const mimeBase = contentType.split(";")[0].trim();
    if (!ALLOWED_CONTENT_TYPES.includes(mimeBase)) {
      return NextResponse.json(
        { error: "Content type not allowed" },
        { status: 400 }
      );
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type not allowed: ${ext}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uploadUrl = `${AWS_APIS.UPLOAD}/upload`;

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "x-case-id": caseId,
      "x-file-name": encodeURIComponent(file.name),
    };

    if (session.awsToken) {
      headers["Authorization"] = `Bearer ${session.awsToken}`;
    } else {
      headers["Authorization"] = `Bearer ${session.idToken}`;
    }

    const awsRes = await fetch(uploadUrl, {
      method: "PUT",
      headers,
      body: arrayBuffer,
    });

    if (!awsRes.ok) {
      const errData = (await awsRes.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      console.error("AWS upload failed:", awsRes.status, errData);
      return NextResponse.json(
        { error: errData.error ?? errData.message ?? "Upload failed" },
        { status: awsRes.status }
      );
    }

    const result = (await awsRes.json().catch(() => ({}))) as {
      fileKey?: string;
      key?: string;
      message?: string;
    };

    return NextResponse.json({
      fileKey: result.fileKey ?? result.key ?? `${caseId}/${file.name}`,
      message: result.message ?? "File uploaded successfully",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Upload proxy error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
