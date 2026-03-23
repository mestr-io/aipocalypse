import { test, expect, describe } from "bun:test";
import { signSession, verifySession } from "./session";

describe("user session", () => {
  test("signSession returns a string with userId.signature format", async () => {
    const token = await signSession("test-user-id");
    expect(token).toContain(".");
    const parts = token.split(".");
    expect(parts[0]).toBe("test-user-id");
    expect(parts[1]!.length).toBeGreaterThan(0);
  });

  test("verifySession returns userId for a valid token", async () => {
    const token = await signSession("my-uuid-123");
    const userId = await verifySession(token);
    expect(userId).toBe("my-uuid-123");
  });

  test("verifySession returns null for tampered signature", async () => {
    const token = await signSession("my-uuid-123");
    const tampered = token.slice(0, -4) + "0000";
    const userId = await verifySession(tampered);
    expect(userId).toBeNull();
  });

  test("verifySession returns null for tampered userId", async () => {
    const token = await signSession("my-uuid-123");
    const parts = token.split(".");
    const tampered = `other-user.${parts[1]}`;
    const userId = await verifySession(tampered);
    expect(userId).toBeNull();
  });

  test("verifySession returns null for garbage input", async () => {
    expect(await verifySession("")).toBeNull();
    expect(await verifySession("no-dot-here")).toBeNull();
    expect(await verifySession("...")).toBeNull();
  });
});
