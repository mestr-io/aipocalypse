import { getDb } from "../index";
import { generateUUIDv7 } from "../uuid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  githubId: number;
  name: string;
  githubUser: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubProfile {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface UserExport {
  user: {
    githubUser: string;
    name: string;
    avatarUrl: string;
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
 * Upsert a user from their GitHub profile.
 *
 * If a user with the given githubId exists, update their name, username,
 * and avatar (these can change on GitHub's side).
 *
 * Returns the user's internal UUID.
 */
export function upsertUser(profile: GitHubProfile): string {
  const db = getDb();
  const now = new Date().toISOString();
  const displayName = profile.name || profile.login;

  // Check if user already exists
  const existing = db
    .query<{ id: string }, [number]>(
      "SELECT id FROM users WHERE githubId = ?"
    )
    .get(profile.id);

  if (existing) {
    // Update profile fields
    db.run(
      `UPDATE users
       SET name = ?, githubUser = ?, avatarUrl = ?, updatedAt = ?
       WHERE githubId = ?`,
      [displayName, profile.login, profile.avatar_url, now, profile.id]
    );
    return existing.id;
  }

  // Insert new user
  const userId = generateUUIDv7();
  db.run(
    `INSERT INTO users (id, githubId, name, githubUser, avatarUrl, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, profile.id, displayName, profile.login, profile.avatar_url, now, now]
  );

  return userId;
}

// ---------------------------------------------------------------------------
// Ban management (uses banned_github_ids table)
// ---------------------------------------------------------------------------

/**
 * Check if a GitHub ID is banned.
 */
export function isGithubIdBanned(githubId: number): boolean {
  const db = getDb();
  const row = db
    .query<{ githubId: number }, [number]>(
      "SELECT githubId FROM banned_github_ids WHERE githubId = ?"
    )
    .get(githubId);
  return !!row;
}

/**
 * Ban a GitHub ID. If already banned, this is a no-op.
 */
export function banGithubId(githubId: number): void {
  const db = getDb();
  db.run(
    "INSERT OR IGNORE INTO banned_github_ids (githubId, bannedAt) VALUES (?, ?)",
    [githubId, new Date().toISOString()]
  );
}

/**
 * Unban a GitHub ID.
 */
export function unbanGithubId(githubId: number): void {
  const db = getDb();
  db.run("DELETE FROM banned_github_ids WHERE githubId = ?", [githubId]);
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
      githubUser: user.githubUser,
      name: user.name,
      avatarUrl: user.avatarUrl,
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
