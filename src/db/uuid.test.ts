import { describe, test, expect } from "bun:test";
import { generateUUIDv7 } from "./uuid";

describe("generateUUIDv7", () => {
  test("returns a string in UUID format", () => {
    const uuid = generateUUIDv7();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(uuid).toMatch(uuidRegex);
  });

  test("version nibble is 7", () => {
    const uuid = generateUUIDv7();
    // The version nibble is the 13th hex character (index 14 accounting for hyphens)
    expect(uuid[14]).toBe("7");
  });

  test("variant bits are 10xx (first hex char of 4th group is 8, 9, a, or b)", () => {
    for (let i = 0; i < 50; i++) {
      const uuid = generateUUIDv7();
      const variantChar = uuid.split("-")[3]![0]!;
      expect(["8", "9", "a", "b"]).toContain(variantChar);
    }
  });

  test("encodes current timestamp in first 48 bits", () => {
    const before = Date.now();
    const uuid = generateUUIDv7();
    const after = Date.now();

    // Extract timestamp: first 8 hex chars + next 4 hex chars = 48 bits
    const parts = uuid.split("-");
    const timestampHex = parts[0]! + parts[1]!;
    const timestamp = parseInt(timestampHex, 16);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  test("UUIDs generated sequentially are lexicographically ordered", async () => {
    const uuids: string[] = [];
    for (let i = 0; i < 10; i++) {
      uuids.push(generateUUIDv7());
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 2));
    }

    for (let i = 1; i < uuids.length; i++) {
      expect(uuids[i]! > uuids[i - 1]!).toBe(true);
    }
  });

  test("generates unique values", () => {
    const uuids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      uuids.add(generateUUIDv7());
    }
    expect(uuids.size).toBe(1000);
  });
});
