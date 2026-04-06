import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { signSession, verifySession, getSessionCookieOptions, getStateCookieOptions } from "./session";

const ORIGINAL_SESSION_SECRET = process.env.SESSION_SECRET;

describe("user session", () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = "test-session-secret";
  });

  afterAll(() => {
    if (ORIGINAL_SESSION_SECRET === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = ORIGINAL_SESSION_SECRET;
    }
  });

  test("signSession returns a signed payload token", async () => {
    const token = await signSession("test-user-id", 1_000);
    expect(token).toContain(".");
    const parts = token.split(".");
    expect(parts[0]!.length).toBeGreaterThan(0);
    expect(parts[1]!.length).toBeGreaterThan(0);
  });

  test("verifySession returns userId for a valid token", async () => {
    const token = await signSession("my-uuid-123", 1_000);
    const userId = await verifySession(token, 2_000);
    expect(userId).toBe("my-uuid-123");
  });

  test("verifySession returns null for tampered signature", async () => {
    const token = await signSession("my-uuid-123", 1_000);
    const tampered = token.slice(0, -4) + "0000";
    const userId = await verifySession(tampered, 2_000);
    expect(userId).toBeNull();
  });

  test("verifySession returns null for expired tokens", async () => {
    const token = await signSession("my-uuid-123", 1_000);
    const userId = await verifySession(token, 1_000 + (31 * 24 * 60 * 60 * 1000));
    expect(userId).toBeNull();
  });

  test("verifySession returns null for garbage input", async () => {
    expect(await verifySession("")).toBeNull();
    expect(await verifySession("no-dot-here")).toBeNull();
    expect(await verifySession("...")).toBeNull();
  });

  test("session cookie is not secure on localhost", () => {
    expect(getSessionCookieOptions("http://localhost:5555/").secure).toBe(false);
    expect(getStateCookieOptions("http://localhost:5555/").secure).toBe(false);
  });

  test("session cookie is secure on non-localhost hosts", () => {
    expect(getSessionCookieOptions("https://mestr.io/").secure).toBe(true);
    expect(getStateCookieOptions("https://mestr.io/").secure).toBe(true);
  });
});
