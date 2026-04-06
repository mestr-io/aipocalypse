/**
 * User session management.
 *
 * Uses HMAC-SHA256 signed cookies containing the user's internal ID and
 * expiration timestamp.
 */

import { getSessionSecret } from "../lib/config";
import { shouldUseSecureCookies } from "../lib/request";
import { signJsonToken, verifyJsonToken } from "../lib/signed-token";

interface SessionPayload {
  userId: string;
  exp: number;
}

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const SESSION_COOKIE = "aipocalypse_session";
export const STATE_COOKIE = "aipocalypse_oauth_state";

/**
 * Sign a user session token containing their ID and expiration timestamp.
 */
export async function signSession(
  userId: string,
  nowMs: number = Date.now(),
): Promise<string> {
  return signJsonToken<SessionPayload>(getSessionSecret(), {
    userId,
    exp: nowMs + SESSION_MAX_AGE_SECONDS * 1000,
  });
}

/**
 * Verify a session token and extract the user ID.
 * Returns the userId if valid and unexpired, null otherwise.
 */
export async function verifySession(
  token: string,
  nowMs: number = Date.now(),
): Promise<string | null> {
  try {
    const payload = await verifyJsonToken<SessionPayload>(getSessionSecret(), token);
    if (!payload || payload.exp <= nowMs) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(requestUrl: string = "http://localhost/", forwardedProto?: string, host?: string) {
  return {
    httpOnly: true,
    sameSite: "Lax" as const,
    secure: shouldUseSecureCookies(requestUrl, forwardedProto, host),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function getStateCookieOptions(requestUrl: string = "http://localhost/", forwardedProto?: string, host?: string) {
  return {
    httpOnly: true,
    sameSite: "Lax" as const,
    secure: shouldUseSecureCookies(requestUrl, forwardedProto, host),
    path: "/",
    maxAge: 600,
  };
}
