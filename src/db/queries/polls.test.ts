import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createPoll, listPolls } from "./polls";
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

  test("inserts question rows with correct order", () => {
    const pollId = createPoll(
      { title: "Poll", body: "", dueDate: "", status: "hidden" },
      ["First", "Second", "Third"]
    );

    const db = new Database(TEST_DB_PATH, { readonly: true });
    const questions = db
      .query('SELECT body, "order" FROM questions WHERE pollId = ? ORDER BY "order"')
      .all(pollId) as Array<{ body: string; order: number }>;

    expect(questions).toHaveLength(3);
    expect(questions[0]!.body).toBe("First");
    expect(questions[0]!.order).toBe(0);
    expect(questions[1]!.body).toBe("Second");
    expect(questions[1]!.order).toBe(1);
    expect(questions[2]!.body).toBe("Third");
    expect(questions[2]!.order).toBe(2);
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
