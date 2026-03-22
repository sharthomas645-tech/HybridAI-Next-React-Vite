// PKCE helpers and Cognito token exchange utilities

export const COGNITO_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "3qkc2c9ucqhhcc483e1os7qdu4",
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? "hybridai.auth.us-west-2.amazoncognito.com",
  region: process.env.NEXT_PUBLIC_COGNITO_REGION ?? "us-west-2",
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
  redirectUri:
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : process.env.NEXTAUTH_URL
        ? `${process.env.NEXTAUTH_URL}/auth/callback`
        : "http://localhost:3000/auth/callback",
};

/** Generate a cryptographically random string for PKCE */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) =>
    ("0" + (byte & 0xff).toString(16)).slice(-2)
  ).join("");
}

/** SHA-256 hash a string and return base64url encoded result */
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/** Generate a PKCE code_verifier + code_challenge pair */
export async function generatePKCE(): Promise<PKCEPair> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await sha256(codeVerifier);
  return { codeVerifier, codeChallenge };
}

/** Build the Cognito authorization URL for PKCE login */
export function buildAuthUrl(codeChallenge: string): string {
  const redirectUri = COGNITO_CONFIG.redirectUri;
  const params = new URLSearchParams({
    client_id: COGNITO_CONFIG.clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://${COGNITO_CONFIG.domain}/oauth2/authorize?${params.toString()}`;
}

/** Build the Cognito logout URL */
export function buildLogoutUrl(): string {
  const redirectUri = COGNITO_CONFIG.redirectUri.replace("/auth/callback", "");
  const params = new URLSearchParams({
    client_id: COGNITO_CONFIG.clientId,
    logout_uri: redirectUri,
  });
  return `https://${COGNITO_CONFIG.domain}/logout?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/** Decode a JWT payload (client-side only, no signature verification) */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return {};
  }
}
