import { getDb } from "../index";
import { generateUUIDv7 } from "../uuid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  hashedId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserExport {
  user: {
    hashedId: string;
    createdAt: string;
  };
  votes: Array<{
    poll: string;
    question: string;
    votedAt: string;
  }>;
  exportedAt: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Find a user by their internal UUID.
 * Returns null if not found.
 */
export function getUserById(id: string): User | null {
  const db = getDb();
  return db
    .query<User, [string]>("SELECT * FROM users WHERE id = ?")
    .get(id);
}

/**
 * Upsert a user from their hashed identity.
 *
 * If a user with the given hashedId exists, update their updatedAt timestamp.
 * Returns the user's internal UUID.
 */
export function upsertUser(hashedId: string): string {
  const db = getDb();
  const now = new Date().toISOString();

  // Check if user already exists
  const existing = db
    .query<{ id: string }, [string]>(
      "SELECT id FROM users WHERE hashedId = ?"
    )
    .get(hashedId);

  if (existing) {
    // Update timestamp only
    db.run(
      `UPDATE users SET updatedAt = ? WHERE hashedId = ?`,
      [now, hashedId]
    );
    return existing.id;
  }

  // Insert new user
  const userId = generateUUIDv7();
  db.run(
    `INSERT INTO users (id, hashedId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?)`,
    [userId, hashedId, now, now]
  );

  return userId;
}

// ---------------------------------------------------------------------------
// Ban management (uses banned_hashed_ids table)
// ---------------------------------------------------------------------------

/**
 * Check if a hashed ID is banned.
 */
export function isHashedIdBanned(hashedId: string): boolean {
  const db = getDb();
  const row = db
    .query<{ hashedId: string }, [string]>(
      "SELECT hashedId FROM banned_hashed_ids WHERE hashedId = ?"
    )
    .get(hashedId);
  return !!row;
}

/**
 * Ban a hashed ID. If already banned, this is a no-op.
 */
export function banHashedId(hashedId: string): void {
  const db = getDb();
  db.run(
    "INSERT OR IGNORE INTO banned_hashed_ids (hashedId, bannedAt) VALUES (?, ?)",
    [hashedId, new Date().toISOString()]
  );
}

/**
 * Unban a hashed ID.
 */
export function unbanHashedId(hashedId: string): void {
  const db = getDb();
  db.run("DELETE FROM banned_hashed_ids WHERE hashedId = ?", [hashedId]);
}

// ---------------------------------------------------------------------------
// GDPR: data export and deletion
// ---------------------------------------------------------------------------

/**
 * Permanently delete a user and all their data.
 * Answers are removed via ON DELETE CASCADE.
 */
export function hardDeleteUser(userId: string): boolean {
  const db = getDb();
  const result = db.run("DELETE FROM users WHERE id = ?", [userId]);
  return result.changes > 0;
}

/**
 * Export all personal data for a user in a GDPR-compliant format.
 * Returns null if the user doesn't exist.
 */
export function exportUserData(userId: string): UserExport | null {
  const db = getDb();

  const user = db
    .query<User, [string]>("SELECT * FROM users WHERE id = ?")
    .get(userId);

  if (!user) return null;

  const votes = db
    .query<
      { pollName: string; questionBody: string; votedAt: string },
      [string]
    >(
      `SELECT p.name AS pollName, q.body AS questionBody, a.createdAt AS votedAt
       FROM answers a
       JOIN polls p ON p.id = a.pollId
       JOIN questions q ON q.id = a.questionId
       WHERE a.userId = ?
       ORDER BY a.createdAt ASC`
    )
    .all(userId);

  return {
    user: {
      hashedId: user.hashedId,
      createdAt: user.createdAt,
    },
    votes: votes.map((v) => ({
      poll: v.pollName,
      question: v.questionBody,
      votedAt: v.votedAt,
    })),
    exportedAt: new Date().toISOString(),
  };
}
