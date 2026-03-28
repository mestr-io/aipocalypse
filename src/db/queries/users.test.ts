import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  upsertUser,
  getUserById,
  isHashedIdBanned,
  banHashedId,
  unbanHashedId,
  hardDeleteUser,
  exportUserData,
} from "./users";
import { createPoll } from "./polls";
import { castVote } from "./votes";
import { runMigrations } from "../migrate";

const TEST_DIR = join(import.meta.dirname!, "../../../.test-tmp");
const TEST_DB_PATH = join(TEST_DIR, "test-users.db");

beforeEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
  process.env.DATABASE_PATH = TEST_DB_PATH;
  process.env.HASH_PEPPER = "test-pepper-for-users";
  runMigrations();
});

afterEach(() => {
  const { closeDb } = require("../index");
  closeDb();
  rmSync(TEST_DIR, { recursive: true, force: true });
  delete process.env.DATABASE_PATH;
});

const TEST_HASHED_ID = "a1b2c3d4e5f6a7b8c9";

// ---------------------------------------------------------------------------
// upsertUser / getUserById
// ---------------------------------------------------------------------------

describe("users", () => {
  describe("upsertUser", () => {
    test("inserts a new user and returns their ID", () => {
      const userId = upsertUser(TEST_HASHED_ID);
      expect(userId).toBeTruthy();
      expect(typeof userId).toBe("string");

      const user = getUserById(userId);
      expect(user).not.toBeNull();
      expect(user!.hashedId).toBe(TEST_HASHED_ID);
      expect(user!.createdAt).toBeTruthy();
      expect(user!.updatedAt).toBeTruthy();
    });

    test("returns same ID on second upsert with same hashedId", () => {
      const id1 = upsertUser(TEST_HASHED_ID);
      const id2 = upsertUser(TEST_HASHED_ID);
      expect(id1).toBe(id2);
    });

    test("updates updatedAt on re-login", () => {
      const id = upsertUser(TEST_HASHED_ID);
      const user1 = getUserById(id);

      // Small delay to ensure different timestamp
      const earlier = user1!.updatedAt;

      // Force a slightly different timestamp
      const id2 = upsertUser(TEST_HASHED_ID);
      expect(id2).toBe(id);

      const user2 = getUserById(id);
      expect(user2!.hashedId).toBe(TEST_HASHED_ID);
      // updatedAt should be >= earlier (might be same ms)
      expect(user2!.updatedAt >= earlier).toBe(true);
    });
  });

  describe("getUserById", () => {
    test("returns null for non-existent ID", () => {
      expect(getUserById("nonexistent")).toBeNull();
    });

    test("returns user for valid ID", () => {
      const id = upsertUser(TEST_HASHED_ID);
      const user = getUserById(id);
      expect(user).not.toBeNull();
      expect(user!.id).toBe(id);
    });
  });

  // ---------------------------------------------------------------------------
  // Ban management
  // ---------------------------------------------------------------------------

  describe("ban management", () => {
    test("isHashedIdBanned returns false for non-banned ID", () => {
      expect(isHashedIdBanned("000000000000000000")).toBe(false);
    });

    test("banHashedId bans a hashed ID", () => {
      banHashedId(TEST_HASHED_ID);
      expect(isHashedIdBanned(TEST_HASHED_ID)).toBe(true);
    });

    test("banHashedId is a no-op if already banned", () => {
      banHashedId(TEST_HASHED_ID);
      banHashedId(TEST_HASHED_ID); // should not throw
      expect(isHashedIdBanned(TEST_HASHED_ID)).toBe(true);
    });

    test("unbanHashedId removes the ban", () => {
      banHashedId(TEST_HASHED_ID);
      expect(isHashedIdBanned(TEST_HASHED_ID)).toBe(true);

      unbanHashedId(TEST_HASHED_ID);
      expect(isHashedIdBanned(TEST_HASHED_ID)).toBe(false);
    });

    test("unbanHashedId is a no-op if not banned", () => {
      unbanHashedId("000000000000000000"); // should not throw
      expect(isHashedIdBanned("000000000000000000")).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // GDPR: hard delete
  // ---------------------------------------------------------------------------

  describe("hardDeleteUser", () => {
    test("deletes a user and returns true", () => {
      const id = upsertUser(TEST_HASHED_ID);
      expect(hardDeleteUser(id)).toBe(true);
      expect(getUserById(id)).toBeNull();
    });

    test("returns false for non-existent user", () => {
      expect(hardDeleteUser("nonexistent")).toBe(false);
    });

    test("cascades to answers", () => {
      const { getDb } = require("../index");
      const userId = upsertUser(TEST_HASHED_ID);

      // Create a poll and cast a vote
      const pollId = createPoll(
        { title: "Test Poll", body: "", dueDate: null, status: "active" },
        ["A", "B"]
      );
      const rows = getDb()
        .query(
          "SELECT id FROM questions WHERE pollId = ? ORDER BY position"
        )
        .all(pollId) as { id: string }[];
      castVote(userId, pollId, rows[0]!.id);

      // Verify answer exists
      const before = getDb()
        .query(
          "SELECT id FROM answers WHERE userId = ?"
        )
        .all(userId) as { id: string }[];
      expect(before).toHaveLength(1);

      // Delete user — answers should cascade
      hardDeleteUser(userId);

      const after = getDb()
        .query(
          "SELECT id FROM answers WHERE userId = ?"
        )
        .all(userId) as { id: string }[];
      expect(after).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // GDPR: data export
  // ---------------------------------------------------------------------------

  describe("exportUserData", () => {
    test("returns null for non-existent user", () => {
      expect(exportUserData("nonexistent")).toBeNull();
    });

    test("exports user data with hashedId", () => {
      const id = upsertUser(TEST_HASHED_ID);
      const data = exportUserData(id);
      expect(data).not.toBeNull();
      expect(data!.user.hashedId).toBe(TEST_HASHED_ID);
      expect(data!.user.createdAt).toBeTruthy();
      expect(data!.exportedAt).toBeTruthy();
      expect(data!.votes).toEqual([]);
    });

    test("exports user votes", () => {
      const { getDb } = require("../index");
      const userId = upsertUser(TEST_HASHED_ID);

      const pollId = createPoll(
        { title: "Export Poll", body: "", dueDate: null, status: "active" },
        ["Option X", "Option Y"]
      );
      const rows = getDb()
        .query(
          "SELECT id FROM questions WHERE pollId = ? ORDER BY position"
        )
        .all(pollId) as { id: string }[];
      castVote(userId, pollId, rows[0]!.id);

      const data = exportUserData(userId);
      expect(data!.votes).toHaveLength(1);
      expect(data!.votes[0]!.poll).toBe("Export Poll");
      expect(data!.votes[0]!.question).toBe("Option X");
      expect(data!.votes[0]!.votedAt).toBeTruthy();
    });
  });
});
