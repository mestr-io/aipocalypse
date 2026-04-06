import { getEnvOrSecret } from "./config";
import { signJsonToken, verifyJsonToken } from "./signed-token";

interface CsrfPayload {
  scope: string;
  subject: string;
  exp: number;
}

function getUserCsrfSecret(): string {
  return getEnvOrSecret(
    "SESSION_SECRET",
    "aipocalypse_session_secret",
    "SESSION_SECRET environment variable is not set"
  );
}

function getAdminCsrfSecret(): string {
  return getEnvOrSecret(
    "ADMIN_SESSION_SECRET",
    "aipocalypse_admin_session_secret",
    "ADMIN_SESSION_SECRET environment variable is not set"
  );
}

async function createCsrfToken(
  secret: string,
  scope: string,
  subject: string,
  ttlSeconds: number,
  nowMs: number,
): Promise<string> {
  return signJsonToken<CsrfPayload>(secret, {
    scope,
    subject,
    exp: nowMs + ttlSeconds * 1000,
  });
}

async function verifyCsrfToken(
  secret: string,
  token: string,
  scope: string,
  subject: string,
  nowMs: number,
): Promise<boolean> {
  const payload = await verifyJsonToken<CsrfPayload>(secret, token);
  if (!payload) {
    return false;
  }

  return payload.scope === scope && payload.subject === subject && payload.exp > nowMs;
}

export function createUserCsrfToken(
  scope: string,
  userId: string,
  ttlSeconds: number = 60 * 60,
  nowMs: number = Date.now(),
): Promise<string> {
  return createCsrfToken(getUserCsrfSecret(), scope, userId, ttlSeconds, nowMs);
}

export function verifyUserCsrfToken(
  token: string,
  scope: string,
  userId: string,
  nowMs: number = Date.now(),
): Promise<boolean> {
  return verifyCsrfToken(getUserCsrfSecret(), token, scope, userId, nowMs);
}

export function createAdminCsrfToken(
  scope: string,
  subject: string = "admin",
  ttlSeconds: number = 60 * 60,
  nowMs: number = Date.now(),
): Promise<string> {
  return createCsrfToken(getAdminCsrfSecret(), scope, subject, ttlSeconds, nowMs);
}

export function verifyAdminCsrfToken(
  token: string,
  scope: string,
  subject: string = "admin",
  nowMs: number = Date.now(),
): Promise<boolean> {
  return verifyCsrfToken(getAdminCsrfSecret(), token, scope, subject, nowMs);
}
