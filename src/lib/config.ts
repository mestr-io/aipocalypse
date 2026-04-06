import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function getSecretsDir(): string {
  return process.env.AIPOCALYPSE_SECRETS_DIR?.trim() || "/run/secrets";
}

function readSecretFile(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }

  const value = readFileSync(path, "utf8").trim();
  return value.length > 0 ? value : null;
}

export function getEnvOrSecret(
  envName: string,
  secretName: string,
  errorMessage?: string,
): string {
  const envValue = process.env[envName]?.trim();
  if (envValue) {
    return envValue;
  }

  const secretPath = join(getSecretsDir(), secretName);
  const secretValue = readSecretFile(secretPath);
  if (secretValue) {
    return secretValue;
  }

  throw new Error(errorMessage ?? `${envName} is not set and secret file ${secretPath} is missing or empty`);
}

export function getSessionSecret(): string {
  return getEnvOrSecret(
    "SESSION_SECRET",
    "aipocalypse_session_secret",
    "SESSION_SECRET environment variable is not set"
  );
}

export function getAdminSessionSecret(): string {
  return getEnvOrSecret(
    "ADMIN_SESSION_SECRET",
    "aipocalypse_admin_session_secret",
    "ADMIN_SESSION_SECRET environment variable is not set"
  );
}
