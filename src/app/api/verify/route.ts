import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AWS_APIS } from "@/lib/constants";
import type { RnVerificationRequest, RnVerificationResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as RnVerificationRequest;

    if (!body.caseId || !body.patientName) {
      return NextResponse.json(
        { error: "Missing required fields: caseId, patientName" },
        { status: 400 }
      );
    }

    const awsRes = await fetch(`${AWS_APIS.VERIFICATION}/rn/request`, {
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
        {
          error:
            errData.error ?? errData.message ?? "RN verification request failed",
        },
        { status: awsRes.status }
      );
    }

    const result = (await awsRes.json()) as RnVerificationResponse;
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "RN verification request failed";
    console.error("Verify proxy error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
