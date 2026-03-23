// Entra ID Authentication Configuration

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

export const ENTRA_CONFIG = {
  clientId: (import.meta.env["VITE_ENTRA_CLIENT_ID"] as string | undefined) ?? "f2907ece-23bb-4e42-87d4-a812798454fa",
  authority: (import.meta.env["VITE_ENTRA_AUTHORITY"] as string | undefined) ?? "https://login.microsoftonline.com/c9ca4727-50d1-4e96-b036-671173f94737",
  scopes: ["openid", "email", "profile"],
} as const;

export interface EntraTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/** Generate a PKCE code_verifier and code_challenge pair */
export async function generatePKCE(): Promise<PKCEPair> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = base64UrlEncode(array);

  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(codeVerifier));
  const codeChallenge = base64UrlEncode(new Uint8Array(digest));

  return { codeVerifier, codeChallenge };
}

function base64UrlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Build the Entra ID authorization URL for PKCE login */
export function buildAuthUrl(codeChallenge: string): string {
  const redirectUri = `${window.location.origin}/auth/callback`;
  const params = new URLSearchParams({
    client_id: ENTRA_CONFIG.clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: ENTRA_CONFIG.scopes.join(" "),
    response_mode: "query",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${ENTRA_CONFIG.authority}/oauth2/v2.0/authorize?${params.toString()}`;
}

/** Exchange authorization code for Entra ID tokens (client-side PKCE) */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<EntraTokenResponse> {
  const tokenEndpoint = `${ENTRA_CONFIG.authority}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: ENTRA_CONFIG.clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    scope: ENTRA_CONFIG.scopes.join(" "),
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = (await response.json()) as {
      error?: string;
      error_description?: string;
    };
    throw new Error(error.error_description ?? error.error ?? "Token exchange failed");
  }

  return response.json() as Promise<EntraTokenResponse>;
}

/** Decode a JWT payload (base64url) — no signature verification */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Build the Entra ID logout URL, redirecting to the app's root after logout */
export function buildLogoutUrl(): string {
  const postLogoutRedirectUri = `${window.location.origin}/`;
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
  });
  return `${ENTRA_CONFIG.authority}/oauth2/v2.0/logout?${params.toString()}`;
}