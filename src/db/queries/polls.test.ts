import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createPoll, listPolls, listActivePolls, getPollWithQuestions, getPollForEdit, updatePoll } from "./polls";
import { runMigrations } from "../migrate";

const TEST_DIR = join(import.meta.dirname!, "../../../.test-tmp");
const TEST_DB_PATH = join(TEST_DIR, "test-polls.db");

beforeEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
  process.env.DATABASE_PATH = TEST_DB_PATH;
  process.env.HASH_PEPPER = "test-pepper-for-polls";

  // Run real migrations to set up schema
  runMigrations();
});

afterEach(() => {
  const { closeDb } = require("../index");
  closeDb();
  rmSync(TEST_DIR, { recursive: true, force: true });
  delete process.env.DATABASE_PATH;
});

describe("createPoll", () => {
  test("creates a poll and returns its ID", () => {
    const id = createPoll(
      { title: "Test Poll", body: "A test poll", dueDate: "2026-12-31", status: "hidden" },
      ["Option A", "Option B"]
    );

    expect(id).toMatch(/^[0-9a-f-]+$/);
  });

  test("inserts poll row with correct data", () => {
    createPoll(
      { title: "My Poll", body: "Description", dueDate: "2026-06-01", status: "active" },
      ["Yes", "No"]
    );

    const db = new Database(TEST_DB_PATH, { readonly: true });
    const polls = db.query("SELECT * FROM polls").all() as Array<{
      name: string;
      body: string;
      status: string;
      dueDate: string;
    }>;

    expect(polls).toHaveLength(1);
    expect(polls[0]!.name).toBe("My Poll");
    expect(polls[0]!.body).toBe("Description");
    expect(polls[0]!.status).toBe("active");
    expect(polls[0]!.dueDate).toBe("2026-06-01");
    db.close();
  });

  test("inserts question rows with correct position (10-based)", () => {
    const pollId = createPoll(
      { title: "Poll", body: "", dueDate: "", status: "hidden" },
      ["First", "Second", "Third"]
    );

    const db = new Database(TEST_DB_PATH, { readonly: true });
    const questions = db
      .query("SELECT body, position FROM questions WHERE pollId = ? ORDER BY position")
      .all(pollId) as Array<{ body: string; position: number }>;

    expect(questions).toHaveLength(3);
    expect(questions[0]!.body).toBe("First");
    expect(questions[0]!.position).toBe(10);
    expect(questions[1]!.body).toBe("Second");
    expect(questions[1]!.position).toBe(20);
    expect(questions[2]!.body).toBe("Third");
    expect(questions[2]!.position).toBe(30);
    db.close();
  });
});

describe("listPolls", () => {
  test("returns empty array when no polls exist", () => {
    const polls = listPolls();
    expect(polls).toEqual([]);
  });

  test("returns polls ordered by creation date descending", async () => {
    createPoll(
      { title: "First", body: "", dueDate: "", status: "hidden" },
      ["A", "B"]
    );
    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 10));
    createPoll(
      { title: "Second", body: "", dueDate: "", status: "active" },
      ["C", "D"]
    );

    const polls = listPolls();
    expect(polls).toHaveLength(2);
    expect(polls[0]!.name).toBe("Second");
    expect(polls[1]!.name).toBe("First");
  });

  test("includes question count", () => {
    createPoll(
      { title: "Poll", body: "", dueDate: "", status: "hidden" },
      ["A", "B", "C"]
    );

    const polls = listPolls();
    expect(polls[0]!.questionCount).toBe(3);
  });

  test("includes soft-deleted polls with deletedAt populated", () => {
    const id = createPoll(
      { title: "Deleted", body: "", dueDate: "", status: "hidden" },
      ["A", "B"]
    );

    const db = new Database(TEST_DB_PATH);
    const deletedTime = new Date().toISOString();
    db.run("UPDATE polls SET deletedAt = ? WHERE id = ?", [deletedTime, id]);
    db.close();

    // Need to close and reopen the singleton after direct DB modification
    const { closeDb } = require("../index");
    closeDb();

    const polls = listPolls();
    expect(polls).toHaveLength(1);
    expect(polls[0]!.name).toBe("Deleted");
    expect(polls[0]!.deletedAt).toBe(deletedTime);
  });

  test("returns null deletedAt for non-deleted polls", () => {
    createPoll(
      { title: "Active", body: "", dueDate: "", status: "active" },
      ["A", "B"]
    );

    const polls = listPolls();
    expect(polls).toHaveLength(1);
    expect(polls[0]!.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Helper to insert a vote (answer) directly via SQL
// ---------------------------------------------------------------------------

function insertVote(pollId: string, questionId: string): void {
  const db = new Database(TEST_DB_PATH);
  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const hashedId = crypto.randomUUID().replace(/-/g, "").slice(0, 18);
  // Create a minimal user for the FK
  db.run(
    `INSERT OR IGNORE INTO users (id, hashedId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?)`,
    [userId, hashedId, now, now]
  );
  db.run(
    `INSERT INTO answers (id, userId, pollId, questionId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), userId, pollId, questionId, now, now]
  );
  db.close();
}

function getQuestionIds(pollId: string): string[] {
  const db = new Database(TEST_DB_PATH, { readonly: true });
  const rows = db
    .query<{ id: string }, [string]>("SELECT id FROM questions WHERE pollId = ? ORDER BY position")
    .all(pollId);
  db.close();
  return rows.map((r) => r.id);
}

describe("listActivePolls", () => {
  test("returns only active polls", () => {
    createPoll({ title: "Hidden", body: "", dueDate: "", status: "hidden" }, ["A", "B"]);
    createPoll({ title: "Active", body: "", dueDate: "", status: "active" }, ["C", "D"]);
    createPoll({ title: "Done", body: "", dueDate: "", status: "done" }, ["E", "F"]);

    const polls = listActivePolls();
    expect(polls).toHaveLength(1);
    expect(polls[0]!.name).toBe("Active");
  });

  test("includes vote count", () => {
    const pollId = createPoll(
      { title: "Active", body: "", dueDate: "", status: "active" },
      ["A", "B"]
    );
    const qIds = getQuestionIds(pollId);
    // Need to close singleton so insertVote can write
    const { closeDb } = require("../index");
    closeDb();

    insertVote(pollId, qIds[0]!);
    insertVote(pollId, qIds[1]!);

    const polls = listActivePolls();
    expect(polls[0]!.voteCount).toBe(2);
  });

  test("returns empty array when no active polls", () => {
    createPoll({ title: "Hidden", body: "", dueDate: "", status: "hidden" }, ["A", "B"]);
    const polls = listActivePolls();
    expect(polls).toEqual([]);
  });
});

describe("getPollWithQuestions", () => {
  test("returns poll with questions and vote counts", () => {
    const pollId = createPoll(
      { title: "My Poll", body: "Body text", dueDate: "2026-12-31", status: "active" },
      ["Opt A", "Opt B", "Opt C"]
    );
    const qIds = getQuestionIds(pollId);
    const { closeDb } = require("../index");
    closeDb();

    insertVote(pollId, qIds[0]!);
    insertVote(pollId, qIds[0]!);
    insertVote(pollId, qIds[2]!);

    const result = getPollWithQuestions(pollId);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("My Poll");
    expect(result!.questions).toHaveLength(3);
    expect(result!.questions[0]!.body).toBe("Opt A");
    expect(result!.questions[0]!.voteCount).toBe(2);
    expect(result!.questions[1]!.voteCount).toBe(0);
    expect(result!.questions[2]!.voteCount).toBe(1);
    expect(result!.totalVotes).toBe(3);
  });

  test("returns questions ordered by position", () => {
    const pollId = createPoll(
      { title: "Poll", body: "", dueDate: "", status: "active" },
      ["First", "Second", "Third"]
    );

    const result = getPollWithQuestions(pollId);
    expect(result!.questions[0]!.body).toBe("First");
    expect(result!.questions[0]!.position).toBe(10);
    expect(result!.questions[1]!.position).toBe(20);
    expect(result!.questions[2]!.position).toBe(30);
  });

  test("returns null for non-existent poll", () => {
    const result = getPollWithQuestions("non-existent-id");
    expect(result).toBeNull();
  });

  test("returns null for soft-deleted poll", () => {
    const pollId = createPoll(
      { title: "Deleted", body: "", dueDate: "", status: "active" },
      ["A", "B"]
    );

    const db = new Database(TEST_DB_PATH);
    db.run("UPDATE polls SET deletedAt = ? WHERE id = ?", [new Date().toISOString(), pollId]);
    db.close();

    const { closeDb } = require("../index");
    closeDb();

    const result = getPollWithQuestions(pollId);
    expect(result).toBeNull();
  });

  test("returns zero votes when no answers exist", () => {
    const pollId = createPoll(
      { title: "Empty", body: "", dueDate: "", status: "active" },
      ["A", "B"]
    );

    const result = getPollWithQuestions(pollId);
    expect(result!.totalVotes).toBe(0);
    expect(result!.questions[0]!.voteCount).toBe(0);
  });
});

describe("getPollForEdit", () => {
  test("returns poll with questions for editing", () => {
    const pollId = createPoll(
      { title: "Edit Me", body: "Body", dueDate: "2026-12-31", status: "hidden" },
      ["Opt A", "Opt B"]
    );

    const result = getPollForEdit(pollId);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Edit Me");
    expect(result!.body).toBe("Body");
    expect(result!.dueDate).toBe("2026-12-31");
    expect(result!.status).toBe("hidden");
    expect(result!.questions).toHaveLength(2);
    expect(result!.questions[0]!.body).toBe("Opt A");
    expect(result!.questions[0]!.position).toBe(10);
  });

  test("returns null for non-existent poll", () => {
    const result = getPollForEdit("non-existent");
    expect(result).toBeNull();
  });

  test("returns null for soft-deleted poll", () => {
    const pollId = createPoll(
      { title: "Deleted", body: "", dueDate: "", status: "hidden" },
      ["A", "B"]
    );

    const db = new Database(TEST_DB_PATH);
    db.run("UPDATE polls SET deletedAt = ? WHERE id = ?", [new Date().toISOString(), pollId]);
    db.close();

    const { closeDb } = require("../index");
    closeDb();

    const result = getPollForEdit(pollId);
    expect(result).toBeNull();
  });
});

describe("updatePoll", () => {
  test("updates poll metadata and questions in-place", () => {
    const pollId = createPoll(
      { title: "Original", body: "Old body", dueDate: "2026-01-01", status: "hidden" },
      ["Old A", "Old B"]
    );

    const originalQuestions = getPollForEdit(pollId)!.questions;
    const qIdA = originalQuestions[0]!.id;
    const qIdB = originalQuestions[1]!.id;

    const success = updatePoll(
      pollId,
      { title: "Updated", body: "New body", dueDate: "2026-06-01", status: "active" },
      [
        { id: qIdA, text: "Edited A" },
        { id: qIdB, text: "Edited B" },
        { text: "New C" },
      ]
    );

    expect(success).toBe(true);

    const updated = getPollForEdit(pollId);
    expect(updated!.name).toBe("Updated");
    expect(updated!.body).toBe("New body");
    expect(updated!.dueDate).toBe("2026-06-01");
    expect(updated!.status).toBe("active");
    expect(updated!.questions).toHaveLength(3);
    expect(updated!.questions[0]!.body).toBe("Edited A");
    expect(updated!.questions[0]!.position).toBe(10);
    expect(updated!.questions[2]!.body).toBe("New C");
    expect(updated!.questions[2]!.position).toBe(30);
  });

  test("preserves question IDs when text changes", () => {
    const pollId = createPoll(
      { title: "Poll", body: "", dueDate: "", status: "hidden" },
      ["Option A", "Option B"]
    );

    const originalIds = getPollForEdit(pollId)!.questions.map((q) => q.id);

    updatePoll(
      pollId,
      { title: "Poll", body: "", dueDate: null, status: "hidden" },
      [
        { id: originalIds[0], text: "Fixed typo A" },
        { id: originalIds[1], text: "Fixed typo B" },
      ]
    );

    const updated = getPollForEdit(pollId)!;
    expect(updated.questions[0]!.id).toBe(originalIds[0]);
    expect(updated.questions[0]!.body).toBe("Fixed typo A");
    expect(updated.questions[1]!.id).toBe(originalIds[1]);
    expect(updated.questions[1]!.body).toBe("Fixed typo B");
  });

  test("adds new questions alongside existing ones", () => {
    const pollId = createPoll(
      { title: "Poll", body: "", dueDate: "", status: "hidden" },
      ["Keep A", "Keep B"]
    );

    const originalIds = getPollForEdit(pollId)!.questions.map((q) => q.id);

    updatePoll(
      pollId,
      { title: "Poll", body: "", dueDate: null, status: "hidden" },
      [
        { id: originalIds[0], text: "Keep A" },
        { id: originalIds[1], text: "Keep B" },
        { text: "Brand New C" },
      ]
    );

    const updated = getPollForEdit(pollId)!;
    expect(updated.questions).toHaveLength(3);
    // Original IDs preserved
    expect(updated.questions[0]!.id).toBe(originalIds[0]);
    expect(updated.questions[1]!.id).toBe(originalIds[1]);
    // New question has a different ID
    expect(updated.questions[2]!.id).not.toBe(originalIds[0]);
    expect(updated.questions[2]!.id).not.toBe(originalIds[1]);
    expect(updated.questions[2]!.body).toBe("Brand New C");
  });

  test("soft-deletes only removed questions", () => {
    const pollId = createPoll(
      { title: "Poll", body: "", dueDate: "", status: "hidden" },
      ["Keep", "Remove Me", "Also Keep"]
    );

    const originalQuestions = getPollForEdit(pollId)!.questions;
    const keepId1 = originalQuestions[0]!.id;
    const removeId = originalQuestions[1]!.id;
    const keepId2 = originalQuestions[2]!.id;

    updatePoll(
      pollId,
      { title: "Poll", body: "", dueDate: null, status: "hidden" },
      [
        { id: keepId1, text: "Keep" },
        { id: keepId2, text: "Also Keep" },
      ]
    );

    const updated = getPollForEdit(pollId)!;
    expect(updated.questions).toHaveLength(2);
    expect(updated.questions[0]!.id).toBe(keepId1);
    expect(updated.questions[1]!.id).toBe(keepId2);

    // Verify removed question is soft-deleted
    const db = new Database(TEST_DB_PATH, { readonly: true });
    const removed = db
      .query<{ deletedAt: string | null }, [string]>(
        "SELECT deletedAt FROM questions WHERE id = ?"
      )
      .get(removeId);
    db.close();

    expect(removed!.deletedAt).not.toBeNull();
  });

  test("preserves votes when editing question text", () => {
    const pollId = createPoll(
      { title: "Poll", body: "", dueDate: "", status: "active" },
      ["Opt A", "Opt B"]
    );

    const qIds = getQuestionIds(pollId);
    const { closeDb } = require("../index");
    closeDb();

    // Insert votes on original questions
    insertVote(pollId, qIds[0]!);
    insertVote(pollId, qIds[0]!);
    insertVote(pollId, qIds[1]!);

    // Edit question text (fix typo) — IDs stay the same
    updatePoll(
      pollId,
      { title: "Poll", body: "", dueDate: null, status: "active" },
      [
        { id: qIds[0], text: "Option A (fixed)" },
        { id: qIds[1], text: "Option B (fixed)" },
      ]
    );

    // Votes should still be associated
    const result = getPollWithQuestions(pollId);
    expect(result!.totalVotes).toBe(3);
    expect(result!.questions[0]!.voteCount).toBe(2);
    expect(result!.questions[1]!.voteCount).toBe(1);
  });

  test("recalculates positions based on new order", () => {
    const pollId = createPoll(
      { title: "Poll", body: "", dueDate: "", status: "hidden" },
      ["First", "Second", "Third"]
    );

    const originalQuestions = getPollForEdit(pollId)!.questions;

    // Reverse the order
    updatePoll(
      pollId,
      { title: "Poll", body: "", dueDate: null, status: "hidden" },
      [
        { id: originalQuestions[2]!.id, text: "Third" },
        { id: originalQuestions[1]!.id, text: "Second" },
        { id: originalQuestions[0]!.id, text: "First" },
      ]
    );

    const updated = getPollForEdit(pollId)!;
    expect(updated.questions[0]!.body).toBe("Third");
    expect(updated.questions[0]!.position).toBe(10);
    expect(updated.questions[1]!.body).toBe("Second");
    expect(updated.questions[1]!.position).toBe(20);
    expect(updated.questions[2]!.body).toBe("First");
    expect(updated.questions[2]!.position).toBe(30);
  });

  test("returns false for non-existent poll", () => {
    const success = updatePoll(
      "non-existent",
      { title: "X", body: "", dueDate: null, status: "hidden" },
      [{ text: "A" }, { text: "B" }]
    );
    expect(success).toBe(false);
  });
});
