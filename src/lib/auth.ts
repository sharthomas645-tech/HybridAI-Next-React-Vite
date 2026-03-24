import { decodeJwtPayload } from "./entra-auth";

export const SESSION_KEY = "hybridai_session";

export interface SessionData {
  accessToken: string;
  idToken: string;
  email: string;
  username: string;
  expiresAt: number;
  /** AWS bearer token obtained via token-exchange Lambda */
  awsToken?: string;
}

/** Read and validate the session from sessionStorage (client-side) */
export function getSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionData;
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/** Persist session to sessionStorage */
export function saveSession(session: SessionData): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Clear the current session */
export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Build session data from Entra ID token response and optional AWS token */
export function buildSession(
  accessToken: string,
  idToken: string,
  expiresIn: number,
  awsToken?: string
): SessionData {
  const payload = decodeJwtPayload(idToken);
  const email =
    (payload["preferred_username"] as string) ??
    (payload["email"] as string) ??
    (payload["upn"] as string) ??
    "";
  const username =
    (payload["name"] as string) ??
    (payload["given_name"] as string) ??
    (payload["sub"] as string) ??
    email;
  return {
    accessToken,
    idToken,
    email,
    username,
    expiresAt: Date.now() + expiresIn * 1000,
    awsToken,
  };
}
