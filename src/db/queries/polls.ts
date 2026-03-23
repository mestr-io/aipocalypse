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
  deletedAt: string | null;
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

export interface AnswerInput {
  id?: string;
  text: string;
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
 * List all polls (including soft-deleted) with question counts.
 * Ordered by creation date descending.
 */
export function listPolls(): PollRow[] {
  const db = getDb();
  return db
    .query<PollRow, []>(
      `SELECT
         p.id, p.name, p.body, p.dueDate, p.status, p.createdAt, p.updatedAt,
         p.deletedAt,
         COUNT(q.id) AS questionCount
       FROM polls p
       LEFT JOIN questions q ON q.pollId = p.id AND q.deletedAt IS NULL
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
 * List all visible polls (active + done), non-deleted, with total vote counts.
 * Active polls first, then done. Within each group, by creation date descending.
 */
export function listPublicPolls(): ActivePollRow[] {
  const db = getDb();
  return db
    .query<ActivePollRow, []>(
      `SELECT
         p.id, p.name, p.body, p.dueDate, p.status, p.createdAt,
         COUNT(a.id) AS voteCount
       FROM polls p
       LEFT JOIN answers a ON a.pollId = p.id AND a.deletedAt IS NULL
       WHERE p.deletedAt IS NULL AND p.status IN ('active', 'done')
       GROUP BY p.id
       ORDER BY
         CASE p.status WHEN 'active' THEN 0 WHEN 'done' THEN 1 END,
         p.createdAt DESC`
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
 * Update a poll and its questions in a single transaction.
 *
 * Questions with an existing `id` are updated in-place (preserving vote
 * associations). Questions without an `id` are inserted as new rows.
 * Existing questions whose IDs are absent from the input are soft-deleted.
 */
export function updatePoll(
  pollId: string,
  input: CreatePollInput,
  answers: AnswerInput[]
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
    // Update poll metadata
    db.run(
      `UPDATE polls SET name = ?, body = ?, dueDate = ?, status = ?, updatedAt = ?
       WHERE id = ?`,
      [input.title, input.body, input.dueDate ?? "", input.status, now, pollId]
    );

    // Get current active question IDs for this poll
    const currentQuestions = db
      .query<{ id: string }, [string]>(
        "SELECT id FROM questions WHERE pollId = ? AND deletedAt IS NULL"
      )
      .all(pollId);
    const currentIds = new Set(currentQuestions.map((q) => q.id));

    // Track which existing IDs are kept
    const keptIds = new Set<string>();

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i]!;
      const position = (i + 1) * 10;

      if (answer.id && currentIds.has(answer.id)) {
        // Update existing question in-place
        db.run(
          `UPDATE questions SET body = ?, position = ?, updatedAt = ?
           WHERE id = ?`,
          [answer.text, position, now, answer.id]
        );
        keptIds.add(answer.id);
      } else {
        // Insert new question
        const questionId = generateUUIDv7();
        db.run(
          `INSERT INTO questions (id, pollId, body, position, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [questionId, pollId, answer.text, position, now, now]
        );
      }
    }

    // Soft-delete questions that were removed from the form
    for (const id of currentIds) {
      if (!keptIds.has(id)) {
        db.run(
          `UPDATE questions SET deletedAt = ?, updatedAt = ? WHERE id = ?`,
          [now, now, id]
        );
      }
    }
  })();

  return true;
}
