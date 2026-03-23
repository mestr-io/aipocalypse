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

  test("excludes soft-deleted polls", () => {
    const id = createPoll(
      { title: "Deleted", body: "", dueDate: "", status: "hidden" },
      ["A", "B"]
    );

    const db = new Database(TEST_DB_PATH);
    db.run("UPDATE polls SET deletedAt = ? WHERE id = ?", [new Date().toISOString(), id]);
    db.close();

    // Need to close and reopen the singleton after direct DB modification
    const { closeDb } = require("../index");
    closeDb();

    const polls = listPolls();
    expect(polls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Helper to insert a vote (answer) directly via SQL
// ---------------------------------------------------------------------------

function insertVote(pollId: string, questionId: string): void {
  const db = new Database(TEST_DB_PATH);
  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  // Create a minimal user for the FK
  db.run(
    `INSERT OR IGNORE INTO users (id, githubId, name, githubUser, avatarUrl, createdAt, updatedAt)
     VALUES (?, ?, 'Test', 'test', 'http://x', ?, ?)`,
    [userId, Math.floor(Math.random() * 1_000_000), now, now]
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
  test("updates poll and replaces questions", () => {
    const pollId = createPoll(
      { title: "Original", body: "Old body", dueDate: "2026-01-01", status: "hidden" },
      ["Old A", "Old B"]
    );

    const success = updatePoll(
      pollId,
      { title: "Updated", body: "New body", dueDate: "2026-06-01", status: "active" },
      ["New X", "New Y", "New Z"]
    );

    expect(success).toBe(true);

    const updated = getPollForEdit(pollId);
    expect(updated!.name).toBe("Updated");
    expect(updated!.body).toBe("New body");
    expect(updated!.dueDate).toBe("2026-06-01");
    expect(updated!.status).toBe("active");
    expect(updated!.questions).toHaveLength(3);
    expect(updated!.questions[0]!.body).toBe("New X");
    expect(updated!.questions[0]!.position).toBe(10);
    expect(updated!.questions[2]!.position).toBe(30);
  });

  test("returns false for non-existent poll", () => {
    const success = updatePoll(
      "non-existent",
      { title: "X", body: "", dueDate: null, status: "hidden" },
      ["A", "B"]
    );
    expect(success).toBe(false);
  });

  test("soft-deletes old questions", () => {
    const pollId = createPoll(
      { title: "Poll", body: "", dueDate: "", status: "hidden" },
      ["Old A", "Old B"]
    );

    updatePoll(
      pollId,
      { title: "Poll", body: "", dueDate: null, status: "hidden" },
      ["New A", "New B"]
    );

    const db = new Database(TEST_DB_PATH, { readonly: true });
    const deleted = db
      .query("SELECT COUNT(*) AS cnt FROM questions WHERE pollId = ? AND deletedAt IS NOT NULL")
      .get(pollId) as { cnt: number };
    const active = db
      .query("SELECT COUNT(*) AS cnt FROM questions WHERE pollId = ? AND deletedAt IS NULL")
      .get(pollId) as { cnt: number };
    db.close();

    expect(deleted.cnt).toBe(2); // old ones soft-deleted
    expect(active.cnt).toBe(2); // new ones active
  });
});
