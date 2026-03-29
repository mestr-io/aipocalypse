import { getDb } from "../index";
import { generateUUIDv7 } from "../uuid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserAnswer {
  id: string;
  userId: string;
  pollId: string;
  questionId: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Cast or change a vote. Uses upsert logic:
 * - If the user has no active answer for this poll, insert one.
 * - If they already voted, update the questionId (vote change).
 *
 * Returns the answer ID.
 */
export function castVote(
  userId: string,
  pollId: string,
  questionId: string
): string {
  const db = getDb();
  const now = new Date().toISOString();

  // Check for existing active answer for this user+poll
  const existing = db
    .query<{ id: string }, [string, string]>(
      "SELECT id FROM answers WHERE userId = ? AND pollId = ?"
    )
    .get(userId, pollId);

  if (existing) {
    // Update existing vote
    db.run(
      `UPDATE answers SET questionId = ?, updatedAt = ? WHERE id = ?`,
      [questionId, now, existing.id]
    );
    return existing.id;
  }

  // Insert new vote
  const answerId = generateUUIDv7();
  db.run(
    `INSERT INTO answers (id, userId, pollId, questionId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [answerId, userId, pollId, questionId, now, now]
  );

  return answerId;
}

/**
 * Get the user's current vote for a poll.
 * Returns the questionId they voted for, or null if they haven't voted.
 */
export function getUserVote(
  userId: string,
  pollId: string
): string | null {
  const db = getDb();
  const row = db
    .query<{ questionId: string }, [string, string]>(
      "SELECT questionId FROM answers WHERE userId = ? AND pollId = ?"
    )
    .get(userId, pollId);

  return row?.questionId ?? null;
}

/**
 * Validate that a questionId belongs to the given poll and is not deleted.
 */
export function isValidQuestion(
  questionId: string,
  pollId: string
): boolean {
  const db = getDb();
  const row = db
    .query<{ id: string }, [string, string]>(
      "SELECT id FROM questions WHERE id = ? AND pollId = ? AND deletedAt IS NULL"
    )
    .get(questionId, pollId);

  return !!row;
}

/**
 * Get all poll IDs the user has voted on.
 * Returns an array of poll IDs (strings).
 */
export function getUserVotedPollIds(userId: string): string[] {
  const db = getDb();
  const rows = db
    .query<{ pollId: string }, [string]>(
      "SELECT DISTINCT pollId FROM answers WHERE userId = ?"
    )
    .all(userId);

  return rows.map((r) => r.pollId);
}
