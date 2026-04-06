const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const failures = new Map<string, number[]>();

function prune(key: string, nowMs: number): number[] {
  const recent = (failures.get(key) ?? []).filter((ts) => nowMs - ts < WINDOW_MS);
  if (recent.length > 0) {
    failures.set(key, recent);
  } else {
    failures.delete(key);
  }
  return recent;
}

export function isAdminLoginRateLimited(key: string, nowMs: number = Date.now()): boolean {
  return prune(key, nowMs).length >= MAX_ATTEMPTS;
}

export function recordAdminLoginFailure(key: string, nowMs: number = Date.now()): void {
  const recent = prune(key, nowMs);
  recent.push(nowMs);
  failures.set(key, recent);
}

export function resetAdminLoginFailures(key: string): void {
  failures.delete(key);
}

export function resetAdminLoginRateLimitStore(): void {
  failures.clear();
}

export const ADMIN_LOGIN_MAX_ATTEMPTS = MAX_ATTEMPTS;
export const ADMIN_LOGIN_WINDOW_MS = WINDOW_MS;
