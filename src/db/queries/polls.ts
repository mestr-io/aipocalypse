import { getDb } from "../index";
import { generateUUIDv7 } from "../uuid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatePollInput {
  title: string;
  body: string;
  dueDate: string | null;
  status: string;
}

export interface PollRow {
  id: string;
  name: string;
  body: string;
  dueDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Create a poll with its answer options (questions) in a single transaction.
 * Returns the new poll ID.
 */
export function createPoll(input: CreatePollInput, answers: string[]): string {
  const db = getDb();
  const now = new Date().toISOString();
  const pollId = generateUUIDv7();

  db.transaction(() => {
    db.run(
      `INSERT INTO polls (id, name, body, dueDate, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        pollId,
        input.title,
        input.body,
        input.dueDate ?? "",
        input.status,
        now,
        now,
      ]
    );

    for (let i = 0; i < answers.length; i++) {
      const questionId = generateUUIDv7();
      db.run(
        `INSERT INTO questions (id, pollId, body, "order", createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [questionId, pollId, answers[i]!, i, now, now]
      );
    }
  })();

  return pollId;
}

/**
 * List all non-deleted polls ordered by creation date descending.
 * Includes a count of non-deleted questions for each poll.
 */
export function listPolls(): PollRow[] {
  const db = getDb();
  return db
    .query<PollRow, []>(
      `SELECT
         p.id, p.name, p.body, p.dueDate, p.status, p.createdAt, p.updatedAt,
         COUNT(q.id) AS questionCount
       FROM polls p
       LEFT JOIN questions q ON q.pollId = p.id AND q.deletedAt IS NULL
       WHERE p.deletedAt IS NULL
       GROUP BY p.id
       ORDER BY p.createdAt DESC`
    )
    .all();
}
