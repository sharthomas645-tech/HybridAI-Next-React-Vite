/** Entra ID (Azure AD) authentication utilities — PKCE OAuth 2.0 flow */

const TENANT_ID =
  process.env.NEXT_PUBLIC_ENTRA_TENANT_ID ?? "c9ca4727-50d1-4e96-b036-671173f94737";
const CLIENT_ID =
  process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID ?? "6e988fb4-f6b5-4e2c-bcf1-6a63f924bd39";
const AUTHORITY =
  process.env.NEXT_PUBLIC_ENTRA_AUTHORITY ??
  `https://login.microsoftonline.com/${TENANT_ID}`;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Entra ID OAuth 2.0 configuration */
export const ENTRA_CONFIG = {
  tenantId: TENANT_ID,
  clientId: CLIENT_ID,
  authority: AUTHORITY,
  redirectUri: `${APP_URL}/auth/callback`,
  scopes: ["openid", "email", "profile"],
} as const;

/** Shape of the token response from Entra ID /oauth2/v2.0/token */
export interface EntraTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

/** PKCE pair returned by generatePKCE */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Generate a PKCE (Proof Key for Code Exchange) pair using the Web Crypto API.
 * Works in both browser and Node.js (Next.js server / Edge runtime).
 */
export async function generatePKCE(): Promise<PKCEPair> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = base64UrlEncode(array);

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const codeChallenge = base64UrlEncode(new Uint8Array(digest));

  return { codeVerifier, codeChallenge };
}

/**
 * Build the Entra ID post-logout redirect URL.
 * Redirects the user back to the app root after signing out.
 */
export function buildLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: ENTRA_CONFIG.clientId,
    post_logout_redirect_uri: APP_URL,
  });
  return `${ENTRA_CONFIG.authority}/oauth2/v2.0/logout?${params.toString()}`;
}

/**
 * Build the Entra ID authorization URL for the PKCE flow.
 * @param codeChallenge - The S256 code challenge derived from the verifier.
 */
export function buildAuthUrl(codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: ENTRA_CONFIG.clientId,
    response_type: "code",
    redirect_uri: ENTRA_CONFIG.redirectUri,
    scope: ENTRA_CONFIG.scopes.join(" "),
    response_mode: "query",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${ENTRA_CONFIG.authority}/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Decode a JWT payload without verifying the signature.
 * Used server-side to extract user claims (email, name) from the id_token.
 * HIPAA note: do not log the returned payload as it may contain PII.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return {};
    const payload = parts[1];
    // Restore base64url padding
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window !== "undefined"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function base64UrlEncode(buffer: Uint8Array): string {
  const binary = String.fromCharCode(...buffer);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}