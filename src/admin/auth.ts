/**
 * Admin authentication helpers.
 *
 * Uses HMAC-SHA256 to sign/verify expiring session tokens.
 */

import { getAdminSessionSecret, getEnvOrSecret } from "../lib/config";
import { appPath } from "../lib/paths";
import { shouldUseSecureCookies } from "../lib/request";
import { signJsonToken, verifyJsonToken } from "../lib/signed-token";

interface AdminSessionPayload {
  iat: number;
  exp: number;
  nonce: string;
}

export const COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getAdminPassword(): string {
  return getEnvOrSecret(
    "ADMIN_PASSWORD",
    "aipocalypse_admin_password",
    "ADMIN_PASSWORD environment variable is not set"
  );
}

/**
 * Create a signed admin session token.
 */
export async function signToken(nowMs: number = Date.now()): Promise<string> {
  return signJsonToken<AdminSessionPayload>(getAdminSessionSecret(), {
    iat: nowMs,
    exp: nowMs + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    nonce: crypto.randomUUID(),
  });
}

/**
 * Verify a signed admin session token.
 * Returns true if the signature is valid and the token is unexpired.
 */
export async function verifyToken(token: string, nowMs: number = Date.now()): Promise<boolean> {
  try {
    const payload = await verifyJsonToken<AdminSessionPayload>(getAdminSessionSecret(), token);
    return !!payload && payload.exp > nowMs;
  } catch {
    return false;
  }
}

/**
 * Check if the provided password matches ADMIN_PASSWORD.
 */
export function checkPassword(password: string): boolean {
  return password === getAdminPassword();
}

/**
 * Cookie options for the admin session.
 */
export function getAdminCookieOptions(requestUrl: string = "http://localhost/", forwardedProto?: string, host?: string) {
  return {
    httpOnly: true,
    sameSite: "Strict" as const,
    secure: shouldUseSecureCookies(requestUrl, forwardedProto, host),
    path: appPath("/admin"),
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}
