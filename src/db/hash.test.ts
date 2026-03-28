import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { computeHashedId, getHashPepper } from "./hash";

const TEST_PEPPER = "test-pepper-for-unit-tests-only";

describe("getHashPepper", () => {
  const originalPepper = process.env.HASH_PEPPER;

  afterAll(() => {
    // Restore original value
    if (originalPepper !== undefined) {
      process.env.HASH_PEPPER = originalPepper;
    } else {
      delete process.env.HASH_PEPPER;
    }
  });

  test("returns pepper when set", () => {
    process.env.HASH_PEPPER = TEST_PEPPER;
    expect(getHashPepper()).toBe(TEST_PEPPER);
  });

  test("throws when HASH_PEPPER is not set", () => {
    delete process.env.HASH_PEPPER;
    expect(() => getHashPepper()).toThrow("HASH_PEPPER environment variable is not set");
  });

  test("throws when HASH_PEPPER is empty string", () => {
    process.env.HASH_PEPPER = "";
    expect(() => getHashPepper()).toThrow("HASH_PEPPER environment variable is not set");
  });
});

describe("computeHashedId", () => {
  const originalPepper = process.env.HASH_PEPPER;

  beforeAll(() => {
    process.env.HASH_PEPPER = TEST_PEPPER;
  });

  afterAll(() => {
    if (originalPepper !== undefined) {
      process.env.HASH_PEPPER = originalPepper;
    } else {
      delete process.env.HASH_PEPPER;
    }
  });

  test("returns exactly 18 characters", () => {
    const hash = computeHashedId(12345);
    expect(hash.length).toBe(18);
  });

  test("returns lowercase hex characters only", () => {
    const hash = computeHashedId(12345);
    expect(hash).toMatch(/^[0-9a-f]{18}$/);
  });

  test("is deterministic — same input always produces same output", () => {
    const hash1 = computeHashedId(12345);
    const hash2 = computeHashedId(12345);
    const hash3 = computeHashedId(12345);
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  test("produces different hashes for different GitHub IDs", () => {
    const hashes = new Set<string>();
    const ids = [1, 2, 3, 100, 999, 12345, 67890, 171500000];
    for (const id of ids) {
      hashes.add(computeHashedId(id));
    }
    expect(hashes.size).toBe(ids.length);
  });

  test("produces different hashes with different peppers", () => {
    const hash1 = computeHashedId(12345);

    process.env.HASH_PEPPER = "a-completely-different-pepper";
    const hash2 = computeHashedId(12345);

    // Restore
    process.env.HASH_PEPPER = TEST_PEPPER;

    expect(hash1).not.toBe(hash2);
  });

  test("each 6-char segment is a valid CSS hex color", () => {
    const hash = computeHashedId(42);
    const seg1 = hash.slice(0, 6);
    const seg2 = hash.slice(6, 12);
    const seg3 = hash.slice(12, 18);

    const hexColor = /^[0-9a-f]{6}$/;
    expect(seg1).toMatch(hexColor);
    expect(seg2).toMatch(hexColor);
    expect(seg3).toMatch(hexColor);
  });
});
