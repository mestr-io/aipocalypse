import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createAdminCsrfToken,
  createUserCsrfToken,
  verifyAdminCsrfToken,
  verifyUserCsrfToken,
} from "./csrf";

const ORIGINAL_SESSION_SECRET = process.env.SESSION_SECRET;
const ORIGINAL_ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

beforeAll(() => {
  process.env.SESSION_SECRET = "test-session-secret";
  process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret";
});

afterAll(() => {
  if (ORIGINAL_SESSION_SECRET === undefined) {
    delete process.env.SESSION_SECRET;
  } else {
    process.env.SESSION_SECRET = ORIGINAL_SESSION_SECRET;
  }

  if (ORIGINAL_ADMIN_SESSION_SECRET === undefined) {
    delete process.env.ADMIN_SESSION_SECRET;
  } else {
    process.env.ADMIN_SESSION_SECRET = ORIGINAL_ADMIN_SESSION_SECRET;
  }
});

describe("csrf helpers", () => {
  test("verifies a valid user csrf token", async () => {
    const token = await createUserCsrfToken("vote", "user-1", 3600, 1_000);
    expect(await verifyUserCsrfToken(token, "vote", "user-1", 2_000)).toBe(true);
  });

  test("rejects user csrf token with wrong scope or subject", async () => {
    const token = await createUserCsrfToken("vote", "user-1", 3600, 1_000);
    expect(await verifyUserCsrfToken(token, "account-delete", "user-1", 2_000)).toBe(false);
    expect(await verifyUserCsrfToken(token, "vote", "user-2", 2_000)).toBe(false);
  });

  test("rejects expired user csrf token", async () => {
    const token = await createUserCsrfToken("vote", "user-1", 1, 1_000);
    expect(await verifyUserCsrfToken(token, "vote", "user-1", 2_500)).toBe(false);
  });

  test("verifies a valid admin csrf token", async () => {
    const token = await createAdminCsrfToken("admin-poll", "admin", 3600, 1_000);
    expect(await verifyAdminCsrfToken(token, "admin-poll", "admin", 2_000)).toBe(true);
  });

  test("rejects tampered admin csrf token", async () => {
    const token = await createAdminCsrfToken("admin-login", "anonymous", 3600, 1_000);
    const tampered = token.slice(0, -4) + "0000";
    expect(await verifyAdminCsrfToken(tampered, "admin-login", "anonymous", 2_000)).toBe(false);
  });
});
