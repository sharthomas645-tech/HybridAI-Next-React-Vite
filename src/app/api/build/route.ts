import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AWS_APIS } from "@/lib/constants";
import type { BuildChronologyRequest, BuildChronologyResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as BuildChronologyRequest;

    if (!body.caseId || !body.fileKey) {
      return NextResponse.json(
        { error: "Missing required fields: caseId, fileKey" },
        { status: 400 }
      );
    }

    const awsRes = await fetch(`${AWS_APIS.CHRONOLOGY}/build`, {
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
        { error: errData.error ?? errData.message ?? "Build chronology failed" },
        { status: awsRes.status }
      );
    }

    const result = (await awsRes.json()) as BuildChronologyResponse;
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Build chronology failed";
    console.error("Build proxy error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
