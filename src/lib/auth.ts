import { cookies } from "next/headers";
import { decodeJwtPayload } from "./cognito";

export const SESSION_COOKIE = "hybridai_session";
export const COOKIE_MAX_AGE = 60 * 60; // 1 hour

export interface SessionData {
  accessToken: string;
  idToken: string;
  email: string;
  username: string;
  expiresAt: number;
}

/** Read and validate the session from httpOnly cookie (server-side only) */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as SessionData;
    if (Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

/** Build session data from token response */
export function buildSession(
  accessToken: string,
  idToken: string,
  expiresIn: number
): SessionData {
  const payload = decodeJwtPayload(idToken);
  const email = (payload["email"] as string) ?? "";
  const username =
    (payload["cognito:username"] as string) ??
    (payload["sub"] as string) ??
    email;
  return {
    accessToken,
    idToken,
    email,
    username,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}
