import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { signToken, verifyToken, checkPassword, getAdminCookieOptions } from "./auth";

const TEST_PASSWORD = "test-admin-pw-12345";
const ORIGINAL_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ORIGINAL_ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

describe("signToken / verifyToken", () => {
  beforeAll(() => {
    process.env.ADMIN_PASSWORD = TEST_PASSWORD;
    process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret";
  });

  afterAll(() => {
    if (ORIGINAL_ADMIN_PASSWORD === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = ORIGINAL_ADMIN_PASSWORD;
    }

    if (ORIGINAL_ADMIN_SESSION_SECRET === undefined) {
      delete process.env.ADMIN_SESSION_SECRET;
    } else {
      process.env.ADMIN_SESSION_SECRET = ORIGINAL_ADMIN_SESSION_SECRET;
    }
  });

  test("signToken returns a signed payload token", async () => {
    const token = await signToken(1_000);
    expect(token).toContain(".");
    const [payload, signature] = token.split(".");
    expect(payload!.length).toBeGreaterThan(0);
    expect(signature!.length).toBeGreaterThan(0);
  });

  test("verifyToken accepts a valid token", async () => {
    const token = await signToken(1_000);
    const valid = await verifyToken(token, 2_000);
    expect(valid).toBe(true);
  });

  test("verifyToken rejects a tampered token", async () => {
    const token = await signToken(1_000);
    const tampered = token.slice(0, -4) + "0000";
    const valid = await verifyToken(tampered, 2_000);
    expect(valid).toBe(false);
  });

  test("verifyToken rejects an expired token", async () => {
    const token = await signToken(1_000);
    const valid = await verifyToken(token, 1_000 + (13 * 60 * 60 * 1000));
    expect(valid).toBe(false);
  });

  test("verifyToken rejects an empty string", async () => {
    expect(await verifyToken("")).toBe(false);
  });

  test("verifyToken rejects a token without a dot", async () => {
    expect(await verifyToken("nodothere")).toBe(false);
  });

  test("verifyToken rejects garbage input", async () => {
    expect(await verifyToken("abc.xyz")).toBe(false);
  });
});

describe("getAdminCookieOptions", () => {
  const originalBasePath = process.env.APP_BASE_PATH;

  afterAll(() => {
    if (originalBasePath === undefined) {
      delete process.env.APP_BASE_PATH;
    } else {
      process.env.APP_BASE_PATH = originalBasePath;
    }
  });

  test("uses /admin by default", () => {
    delete process.env.APP_BASE_PATH;
    const options = getAdminCookieOptions("http://localhost:5555/admin");
    expect(options.path).toBe("/admin");
    expect(options.secure).toBe(false);
  });

  test("prefixes admin cookie path when APP_BASE_PATH is set", () => {
    process.env.APP_BASE_PATH = "/aipocalypse";
    expect(getAdminCookieOptions("http://localhost:5555/admin").path).toBe("/aipocalypse/admin");
  });

  test("uses secure cookies on non-localhost origins", () => {
    expect(getAdminCookieOptions("https://mestr.io/admin").secure).toBe(true);
  });
});

describe("checkPassword", () => {
  test("returns true for the correct password", () => {
    process.env.ADMIN_PASSWORD = TEST_PASSWORD;
    expect(checkPassword(TEST_PASSWORD)).toBe(true);
  });

  test("returns false for an incorrect password", () => {
    process.env.ADMIN_PASSWORD = TEST_PASSWORD;
    expect(checkPassword("wrong")).toBe(false);
  });

  test("returns false for an empty string", () => {
    process.env.ADMIN_PASSWORD = TEST_PASSWORD;
    expect(checkPassword("")).toBe(false);
  });
});
