// Entra ID (Azure AD) PKCE auth utilities
// Replaces cognito.ts — uses same PKCE pattern with Entra ID endpoints

export const ENTRA_CONFIG = {
  tenantId:
    process.env.NEXT_PUBLIC_ENTRA_TENANT_ID ??
    "c9ca4727-50d1-4e96-b036-671173f94737",
  clientId:
    process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID ??
    "f2907ece-23bb-4e42-87d4-a812798454fa",
  get authority() {
    return (
      process.env.NEXT_PUBLIC_ENTRA_AUTHORITY ??
      `https://login.microsoftonline.com/${this.tenantId}`
    );
  },
  get redirectUri() {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/auth/callback`;
    }
    const base =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000";
    return `${base}/auth/callback`;
  },
  scopes: ["openid", "email", "profile"],
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

/** Build the Entra ID authorization URL for PKCE login */
export function buildAuthUrl(codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: ENTRA_CONFIG.clientId,
    response_type: "code",
    scope: ENTRA_CONFIG.scopes.join(" "),
    redirect_uri: ENTRA_CONFIG.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    response_mode: "query",
  });
  return `${ENTRA_CONFIG.authority}/oauth2/v2.0/authorize?${params.toString()}`;
}

/** Build the Entra ID logout URL */
export function buildLogoutUrl(): string {
  const postLogoutUri =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutUri,
  });
  return `${ENTRA_CONFIG.authority}/oauth2/v2.0/logout?${params.toString()}`;
}

export interface EntraTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
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
