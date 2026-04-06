import { describe, expect, test } from "bun:test";
import {
  ADMIN_LOGIN_MAX_ATTEMPTS,
  ADMIN_LOGIN_WINDOW_MS,
  isAdminLoginRateLimited,
  recordAdminLoginFailure,
  resetAdminLoginFailures,
  resetAdminLoginRateLimitStore,
} from "./rate-limit";

describe("admin login rate limiting", () => {
  test("rate limits after repeated failures within the window", () => {
    resetAdminLoginRateLimitStore();

    for (let i = 0; i < ADMIN_LOGIN_MAX_ATTEMPTS; i++) {
      recordAdminLoginFailure("client-1", i * 1_000);
    }

    expect(isAdminLoginRateLimited("client-1", ADMIN_LOGIN_MAX_ATTEMPTS * 1_000)).toBe(true);
  });

  test("successful login reset clears failures", () => {
    resetAdminLoginRateLimitStore();
    for (let i = 0; i < ADMIN_LOGIN_MAX_ATTEMPTS; i++) {
      recordAdminLoginFailure("client-1", i * 1_000);
    }

    resetAdminLoginFailures("client-1");
    expect(isAdminLoginRateLimited("client-1", 10_000)).toBe(false);
  });

  test("old failures expire out of the window", () => {
    resetAdminLoginRateLimitStore();
    for (let i = 0; i < ADMIN_LOGIN_MAX_ATTEMPTS; i++) {
      recordAdminLoginFailure("client-1", i * 1_000);
    }

    expect(isAdminLoginRateLimited("client-1", ADMIN_LOGIN_WINDOW_MS + 10_000)).toBe(false);
  });
});
