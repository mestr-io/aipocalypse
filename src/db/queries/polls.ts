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

export interface ActivePollRow {
  id: string;
  name: string;
  body: string;
  dueDate: string;
  status: string;
  createdAt: string;
  voteCount: number;
}

export interface QuestionWithVotes {
  id: string;
  body: string;
  position: number;
  voteCount: number;
}

export interface PollDetail {
  id: string;
  name: string;
  body: string;
  dueDate: string;
  status: string;
  createdAt: string;
  questions: QuestionWithVotes[];
  totalVotes: number;
}

export interface QuestionRow {
  id: string;
  body: string;
  position: number;
}

export interface PollForEdit {
  id: string;
  name: string;
  body: string;
  dueDate: string;
  status: string;
  questions: QuestionRow[];
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
        `INSERT INTO questions (id, pollId, body, position, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [questionId, pollId, answers[i]!, (i + 1) * 10, now, now]
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

/**
 * List all active, non-deleted polls with total vote counts.
 * Ordered by creation date descending.
 */
export function listActivePolls(): ActivePollRow[] {
  const db = getDb();
  return db
    .query<ActivePollRow, []>(
      `SELECT
         p.id, p.name, p.body, p.dueDate, p.status, p.createdAt,
         COUNT(a.id) AS voteCount
       FROM polls p
       LEFT JOIN answers a ON a.pollId = p.id AND a.deletedAt IS NULL
       WHERE p.deletedAt IS NULL AND p.status = 'active'
       GROUP BY p.id
       ORDER BY p.createdAt DESC`
    )
    .all();
}

/**
 * Get a single poll with its questions and per-question vote counts.
 * Returns null if the poll doesn't exist or is soft-deleted.
 */
export function getPollWithQuestions(pollId: string): PollDetail | null {
  const db = getDb();

  const poll = db
    .query<
      { id: string; name: string; body: string; dueDate: string; status: string; createdAt: string },
      [string]
    >(
      `SELECT id, name, body, dueDate, status, createdAt
       FROM polls
       WHERE id = ? AND deletedAt IS NULL`
    )
    .get(pollId);

  if (!poll) return null;

  const questions = db
    .query<QuestionWithVotes, [string]>(
      `SELECT
         q.id, q.body, q.position,
         COUNT(a.id) AS voteCount
       FROM questions q
       LEFT JOIN answers a ON a.questionId = q.id AND a.deletedAt IS NULL
       WHERE q.pollId = ? AND q.deletedAt IS NULL
       GROUP BY q.id
       ORDER BY q.position ASC`
    )
    .all(pollId);

  const totalVotes = questions.reduce((sum, q) => sum + q.voteCount, 0);

  return {
    ...poll,
    questions,
    totalVotes,
  };
}

/**
 * Get a poll and its questions for editing.
 * Returns null if the poll doesn't exist or is soft-deleted.
 */
export function getPollForEdit(pollId: string): PollForEdit | null {
  const db = getDb();

  const poll = db
    .query<
      { id: string; name: string; body: string; dueDate: string; status: string },
      [string]
    >(
      `SELECT id, name, body, dueDate, status
       FROM polls
       WHERE id = ? AND deletedAt IS NULL`
    )
    .get(pollId);

  if (!poll) return null;

  const questions = db
    .query<QuestionRow, [string]>(
      `SELECT id, body, position
       FROM questions
       WHERE pollId = ? AND deletedAt IS NULL
       ORDER BY position ASC`
    )
    .all(pollId);

  return { ...poll, questions };
}

/**
 * Update a poll and replace its questions in a single transaction.
 * Old questions are soft-deleted; new ones are inserted with 10-based positions.
 */
export function updatePoll(
  pollId: string,
  input: CreatePollInput,
  answers: string[]
): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  // Check if poll exists
  const existing = db
    .query<{ id: string }, [string]>(
      "SELECT id FROM polls WHERE id = ? AND deletedAt IS NULL"
    )
    .get(pollId);

  if (!existing) return false;

  db.transaction(() => {
    // Update poll
    db.run(
      `UPDATE polls SET name = ?, body = ?, dueDate = ?, status = ?, updatedAt = ?
       WHERE id = ?`,
      [input.title, input.body, input.dueDate ?? "", input.status, now, pollId]
    );

    // Soft-delete old questions
    db.run(
      `UPDATE questions SET deletedAt = ?, updatedAt = ?
       WHERE pollId = ? AND deletedAt IS NULL`,
      [now, now, pollId]
    );

    // Insert new questions
    for (let i = 0; i < answers.length; i++) {
      const questionId = generateUUIDv7();
      db.run(
        `INSERT INTO questions (id, pollId, body, position, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [questionId, pollId, answers[i]!, (i + 1) * 10, now, now]
      );
    }
  })();

  return true;
}
