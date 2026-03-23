import { Database } from "bun:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

let db: Database | null = null;

/**
 * Returns the singleton SQLite database connection.
 * Creates the database file and parent directories on first call.
 */
export function getDb(): Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH ?? "data/aipocalypse.db";
  const dir = dirname(dbPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.run("PRAGMA journal_mode = WAL");
  // Enable foreign key enforcement
  db.run("PRAGMA foreign_keys = ON");

  return db;
}

/**
 * Close the database connection. Used in tests for cleanup.
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
