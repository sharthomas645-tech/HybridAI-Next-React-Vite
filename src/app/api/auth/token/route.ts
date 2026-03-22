import { NextRequest, NextResponse } from "next/server";
import { COGNITO_CONFIG, TokenResponse } from "@/lib/cognito";
import { buildSession, SESSION_COOKIE, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier, redirectUri } = (await request.json()) as {
      code: string;
      codeVerifier: string;
      redirectUri: string;
    };

    if (!code || !codeVerifier || !redirectUri) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const appOrigin =
      process.env.NEXTAUTH_URL ?? request.headers.get("origin") ?? "";
    if (appOrigin && !redirectUri.startsWith(appOrigin)) {
      return NextResponse.json(
        { error: "Invalid redirect URI" },
        { status: 400 }
      );
    }

    const tokenEndpoint = `https://${COGNITO_CONFIG.domain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: COGNITO_CONFIG.clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const cognitoResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!cognitoResponse.ok) {
      const errorData = (await cognitoResponse.json()) as {
        error?: string;
        error_description?: string;
      };
      console.error("Cognito token exchange failed:", errorData);
      return NextResponse.json(
        {
          error: "Authentication failed",
          detail: errorData.error_description ?? errorData.error,
        },
        { status: 401 }
      );
    }

    const tokens = (await cognitoResponse.json()) as TokenResponse;
    const session = buildSession(
      tokens.access_token,
      tokens.id_token,
      tokens.expires_in
    );

    const response = NextResponse.json({ success: true, email: session.email });
    response.cookies.set(SESSION_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Token exchange error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
