import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { signToken, verifyToken, checkPassword } from "./auth";

const TEST_PASSWORD = "test-admin-pw-12345";

beforeAll(() => {
  process.env.ADMIN_PASSWORD = TEST_PASSWORD;
});

afterAll(() => {
  delete process.env.ADMIN_PASSWORD;
});

describe("signToken / verifyToken", () => {
  test("signToken returns a string with timestamp.signature format", async () => {
    const token = await signToken();
    expect(token).toContain(".");
    const [timestamp, signature] = token.split(".");
    expect(Number(timestamp)).toBeGreaterThan(0);
    expect(signature!.length).toBeGreaterThan(0);
  });

  test("verifyToken accepts a valid token", async () => {
    const token = await signToken();
    const valid = await verifyToken(token);
    expect(valid).toBe(true);
  });

  test("verifyToken rejects a tampered token", async () => {
    const token = await signToken();
    const tampered = token.slice(0, -4) + "0000";
    const valid = await verifyToken(tampered);
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

describe("checkPassword", () => {
  test("returns true for the correct password", () => {
    expect(checkPassword(TEST_PASSWORD)).toBe(true);
  });

  test("returns false for an incorrect password", () => {
    expect(checkPassword("wrong")).toBe(false);
  });

  test("returns false for an empty string", () => {
    expect(checkPassword("")).toBe(false);
  });
});
