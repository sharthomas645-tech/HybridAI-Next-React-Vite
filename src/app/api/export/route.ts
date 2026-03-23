import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AWS_APIS } from "@/lib/constants";
import type { ExportRequest, ExportResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ExportRequest;

    if (!body.caseId || !body.chronologyId) {
      return NextResponse.json(
        { error: "Missing required fields: caseId, chronologyId" },
        { status: 400 }
      );
    }

    const awsRes = await fetch(`${AWS_APIS.EXPORT}/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.awsToken ?? session.idToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!awsRes.ok) {
      const errData = (await awsRes.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      return NextResponse.json(
        { error: errData.error ?? errData.message ?? "Export failed" },
        { status: awsRes.status }
      );
    }

    const result = (await awsRes.json()) as ExportResponse;
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    console.error("Export proxy error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
