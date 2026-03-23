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
  isBanned: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface GitHubProfile {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Find a user by their internal UUID.
 * Returns null if not found or soft-deleted.
 */
export function getUserById(id: string): User | null {
  const db = getDb();
  return db
    .query<User, [string]>(
      "SELECT * FROM users WHERE id = ? AND deletedAt IS NULL"
    )
    .get(id);
}

/**
 * Upsert a user from their GitHub profile.
 *
 * If a user with the given githubId exists, update their name, username,
 * and avatar (these can change on GitHub's side). If they were soft-deleted,
 * restore them.
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
    // Update profile fields + clear soft-delete if needed
    db.run(
      `UPDATE users
       SET name = ?, githubUser = ?, avatarUrl = ?, updatedAt = ?, deletedAt = NULL
       WHERE githubId = ?`,
      [displayName, profile.login, profile.avatar_url, now, profile.id]
    );
    return existing.id;
  }

  // Insert new user
  const userId = generateUUIDv7();
  db.run(
    `INSERT INTO users (id, githubId, name, githubUser, avatarUrl, isBanned, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [userId, profile.id, displayName, profile.login, profile.avatar_url, now, now]
  );

  return userId;
}
