/**
 * User session management.
 *
 * Uses HMAC-SHA256 signed cookies containing the user's internal ID.
 * Format: `<userId>.<hex-signature>`
 *
 * The signing key is GITHUB_CLIENT_SECRET — a server-side secret
 * that's already required in the environment.
 */

import { getEnvOrSecret } from "../lib/config";

function getSecret(): string {
  return getEnvOrSecret(
    "GITHUB_CLIENT_SECRET",
    "aipocalypse_github_client_secret",
    "GITHUB_CLIENT_SECRET environment variable is not set"
  );
}

/**
 * Sign a user session token containing their ID.
 */
export async function signSession(userId: string): Promise<string> {
  const secret = getSecret();

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(userId)
  );

  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${userId}.${hex}`;
}

/**
 * Verify a session token and extract the user ID.
 * Returns the userId if valid, null otherwise.
 */
export async function verifySession(token: string): Promise<string | null> {
  try {
    const secret = getSecret();
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) return null;

    const userId = token.slice(0, dotIndex);
    const providedHex = token.slice(dotIndex + 1);

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(userId)
    );

    const expectedHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (providedHex !== expectedHex) return null;

    return userId;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "aipocalypse_session";
export const STATE_COOKIE = "aipocalypse_oauth_state";
