/**
 * Migration 004: Hash Identity
 *
 * Replaces PII columns (githubId, name, githubUser, avatarUrl) in the
 * users table with a single hashedId column. Creates banned_hashed_ids
 * table and migrates existing bans. Drops the old banned_github_ids table.
 *
 * This is a TypeScript migration because it needs to compute HMAC hashes
 * at the application level — something pure SQL cannot do.
 *
 * REQUIRES: HASH_PEPPER environment variable to be set.
 */
import type { Database } from "bun:sqlite";
import { computeHashedId, getHashPepper } from "../hash";

export function migrate(db: Database): void {
  // 2.7 Guard: abort with clear error if HASH_PEPPER is not set
  getHashPepper();

  // 2.1 Add hashedId column to users table
  db.run("ALTER TABLE users ADD COLUMN hashedId TEXT");

  // 2.2 Compute hashes for all existing users
  const users = db
    .query("SELECT id, githubId FROM users")
    .all() as Array<{ id: string; githubId: number }>;

  const updateStmt = db.prepare(
    "UPDATE users SET hashedId = ? WHERE id = ?"
  );
  for (const user of users) {
    const hashedId = computeHashedId(user.githubId);
    updateStmt.run(hashedId, user.id);
  }

  // 2.3 Rebuild users table with only id, hashedId, createdAt, updatedAt
  db.exec(`
    CREATE TABLE users_new (
      id TEXT PRIMARY KEY,
      hashedId TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.exec(`
    INSERT INTO users_new (id, hashedId, createdAt, updatedAt)
    SELECT id, hashedId, createdAt, updatedAt
    FROM users
  `);

  db.exec("DROP TABLE users");
  db.exec("ALTER TABLE users_new RENAME TO users");

  // Recreate answers table to fix foreign key reference after table rebuild
  db.exec(`
    CREATE TABLE answers_new (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pollId TEXT NOT NULL REFERENCES polls(id),
      questionId TEXT NOT NULL REFERENCES questions(id),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.exec(`
    INSERT INTO answers_new (id, userId, pollId, questionId, createdAt, updatedAt)
    SELECT id, userId, pollId, questionId, createdAt, updatedAt
    FROM answers
  `);

  db.exec("DROP TABLE answers");
  db.exec("ALTER TABLE answers_new RENAME TO answers");

  // Recreate indexes on answers
  db.exec("CREATE UNIQUE INDEX idx_answers_user_poll ON answers(userId, pollId)");
  db.exec("CREATE INDEX idx_answers_pollId ON answers(pollId)");
  db.exec("CREATE INDEX idx_answers_questionId ON answers(questionId)");

  // 2.4 Create banned_hashed_ids table
  db.exec(`
    CREATE TABLE banned_hashed_ids (
      hashedId TEXT PRIMARY KEY,
      bannedAt TEXT NOT NULL
    )
  `);

  // 2.5 Migrate existing banned_github_ids entries
  const bannedRows = db
    .query("SELECT githubId, bannedAt FROM banned_github_ids")
    .all() as Array<{ githubId: number; bannedAt: string }>;

  const insertBanStmt = db.prepare(
    "INSERT OR IGNORE INTO banned_hashed_ids (hashedId, bannedAt) VALUES (?, ?)"
  );
  for (const row of bannedRows) {
    const hashedId = computeHashedId(row.githubId);
    insertBanStmt.run(hashedId, row.bannedAt);
  }

  // 2.6 Drop banned_github_ids table
  db.exec("DROP TABLE banned_github_ids");
}
