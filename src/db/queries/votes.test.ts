import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { castVote, getUserVote, isValidQuestion } from "./votes";
import { createPoll } from "./polls";
import { upsertUser } from "./users";
import { runMigrations } from "../migrate";

const TEST_DIR = join(import.meta.dirname!, "../../../.test-tmp");
const TEST_DB_PATH = join(TEST_DIR, "test-votes.db");

let userId: string;
let pollId: string;
let questionIds: string[];

beforeEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
  process.env.DATABASE_PATH = TEST_DB_PATH;
  process.env.HASH_PEPPER = "test-pepper-for-votes";
  runMigrations();

  // Seed a user
  userId = upsertUser("aabbcc112233445566");

  // Seed a poll with 2 questions
  pollId = createPoll(
    { title: "Vote Test Poll", body: "Test", dueDate: null, status: "active" },
    ["Option A", "Option B"]
  );

  // Get question IDs
  const { getDb } = require("../index");
  const rows = getDb()
    .query("SELECT id FROM questions WHERE pollId = ? AND deletedAt IS NULL ORDER BY position")
    .all(pollId) as { id: string }[];
  questionIds = rows.map((r) => r.id);
});

afterEach(() => {
  const { closeDb } = require("../index");
  closeDb();
  rmSync(TEST_DIR, { recursive: true, force: true });
  delete process.env.DATABASE_PATH;
});

describe("votes", () => {
  describe("castVote", () => {
    test("creates a new vote", () => {
      const answerId = castVote(userId, pollId, questionIds[0]!);
      expect(answerId).toBeTruthy();

      const vote = getUserVote(userId, pollId);
      expect(vote).toBe(questionIds[0]!);
    });

    test("changes vote when casting again", () => {
      castVote(userId, pollId, questionIds[0]!);
      expect(getUserVote(userId, pollId)).toBe(questionIds[0]!);

      castVote(userId, pollId, questionIds[1]!);
      expect(getUserVote(userId, pollId)).toBe(questionIds[1]!);
    });

    test("returns same answerId when changing vote", () => {
      const id1 = castVote(userId, pollId, questionIds[0]!);
      const id2 = castVote(userId, pollId, questionIds[1]!);
      expect(id2).toBe(id1);
    });

    test("different users can vote on same poll", () => {
      const userId2 = upsertUser("ddeeff667788990011");

      castVote(userId, pollId, questionIds[0]!);
      castVote(userId2, pollId, questionIds[1]!);

      expect(getUserVote(userId, pollId)).toBe(questionIds[0]!);
      expect(getUserVote(userId2, pollId)).toBe(questionIds[1]!);
    });
  });

  describe("getUserVote", () => {
    test("returns null when user has not voted", () => {
      expect(getUserVote(userId, pollId)).toBeNull();
    });

    test("returns questionId when user has voted", () => {
      castVote(userId, pollId, questionIds[0]!);
      expect(getUserVote(userId, pollId)).toBe(questionIds[0]!);
    });
  });

  describe("isValidQuestion", () => {
    test("returns true for valid question in poll", () => {
      expect(isValidQuestion(questionIds[0]!, pollId)).toBe(true);
    });

    test("returns false for question in different poll", () => {
      const otherPollId = createPoll(
        { title: "Other Poll", body: "Other", dueDate: null, status: "active" },
        ["X", "Y"]
      );
      expect(isValidQuestion(questionIds[0]!, otherPollId)).toBe(false);
    });

    test("returns false for non-existent question", () => {
      expect(isValidQuestion("nonexistent", pollId)).toBe(false);
    });

    test("returns false for soft-deleted question", () => {
      const { getDb } = require("../index");
      getDb().run("UPDATE questions SET deletedAt = ? WHERE id = ?", [
        new Date().toISOString(),
        questionIds[0]!,
      ]);
      expect(isValidQuestion(questionIds[0]!, pollId)).toBe(false);
    });
  });
});
