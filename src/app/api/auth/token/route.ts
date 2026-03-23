import { NextRequest, NextResponse } from "next/server";
import { ENTRA_CONFIG, EntraTokenResponse } from "@/lib/entra-auth";
import { buildSession, SESSION_COOKIE, COOKIE_MAX_AGE } from "@/lib/auth";
import { AWS_APIS } from "@/lib/constants";

/** AWS token-exchange response shape */
interface AwsTokenExchangeResponse {
  token?: string;
  access_token?: string;
  expires_in?: number;
  message?: string;
}

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
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      request.headers.get("origin") ??
      "";
    if (appOrigin && !redirectUri.startsWith(appOrigin)) {
      return NextResponse.json(
        { error: "Invalid redirect URI" },
        { status: 400 }
      );
    }

    // Step 1: Exchange authorization code with Entra ID
    const tokenEndpoint = `${ENTRA_CONFIG.authority}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: ENTRA_CONFIG.clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      scope: ENTRA_CONFIG.scopes.join(" "),
    });

    const entraResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!entraResponse.ok) {
      const errorData = (await entraResponse.json()) as {
        error?: string;
        error_description?: string;
      };
      console.error("Entra ID token exchange failed:", errorData);
      return NextResponse.json(
        {
          error: "Authentication failed",
          detail: errorData.error_description ?? errorData.error,
        },
        { status: 401 }
      );
    }

    const tokens = (await entraResponse.json()) as EntraTokenResponse;

    // Step 2: Exchange Entra ID id_token for AWS credentials
    let awsToken: string | undefined;
    try {
      const awsRes = await fetch(
        `${AWS_APIS.TOKEN_EXCHANGE}/token-exchange`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.id_token}`,
          },
          body: JSON.stringify({ id_token: tokens.id_token }),
        }
      );

      if (awsRes.ok) {
        const awsData = (await awsRes.json()) as AwsTokenExchangeResponse;
        awsToken = awsData.token ?? awsData.access_token;
      } else {
        console.warn("AWS token exchange returned non-OK:", awsRes.status);
      }
    } catch (awsErr) {
      // AWS exchange is best-effort; log but don't block login
      console.warn("AWS token exchange error:", awsErr);
    }

    const session = buildSession(
      tokens.access_token,
      tokens.id_token,
      tokens.expires_in,
      awsToken
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
