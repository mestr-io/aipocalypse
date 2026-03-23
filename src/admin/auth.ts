/**
 * Admin authentication helpers.
 *
 * Uses HMAC-SHA256 to sign/verify session tokens.
 * The ADMIN_PASSWORD env var is used as the signing key.
 */

function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD environment variable is not set");
  return pw;
}

/**
 * Create a signed admin session token.
 * Format: `<timestamp>.<hex-signature>`
 */
export async function signToken(): Promise<string> {
  const password = getAdminPassword();
  const timestamp = Date.now().toString();

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp)
  );

  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${timestamp}.${hex}`;
}

/**
 * Verify a signed admin session token.
 * Returns true if the signature is valid.
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const password = getAdminPassword();
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) return false;

    const timestamp = token.slice(0, dotIndex);
    const providedHex = token.slice(dotIndex + 1);

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(timestamp)
    );

    const expectedHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return providedHex === expectedHex;
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
export const COOKIE_NAME = "admin_session";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "Strict" as const,
  path: "/admin",
};
