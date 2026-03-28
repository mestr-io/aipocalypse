import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Database } from "bun:sqlite";
import { getDb } from "./index";

const MIGRATIONS_DIR = resolve(import.meta.dirname!, "migrations");

/**
 * Interface for TypeScript migration files.
 * `.ts` migrations must export a `migrate(db)` function.
 */
export interface TsMigration {
  migrate: (db: Database) => void;
}

/**
 * Run all pending migrations.
 * Tracks applied migrations in a `_migrations` table.
 *
 * Supports two migration file types:
 * - `.sql` files: executed directly via db.exec()
 * - `.ts` files: must export a `migrate(db)` function
 *
 * Both types are executed inside a transaction and sorted
 * alphabetically alongside each other.
 */
export function runMigrations(migrationsDir: string = MIGRATIONS_DIR): void {
  const db = getDb();

  // Ensure the tracking table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      appliedAt TEXT NOT NULL
    )
  `);

  // Get already-applied migrations
  const applied = new Set(
    db
      .query("SELECT name FROM _migrations")
      .all()
      .map((row) => (row as { name: string }).name)
  );

  // Read migration files, sorted alphabetically
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") || f.endsWith(".ts"))
    .sort();

  let count = 0;

  for (const file of files) {
    if (applied.has(file)) continue;

    if (file.endsWith(".sql")) {
      const sql = readFileSync(join(migrationsDir, file), "utf-8");

      db.transaction(() => {
        db.exec(sql);
        db.run("INSERT INTO _migrations (name, appliedAt) VALUES (?, ?)", [
          file,
          new Date().toISOString(),
        ]);
      })();
    } else {
      // TypeScript migration — require() to load synchronously
      const mod = require(join(migrationsDir, file)) as TsMigration;
      if (typeof mod.migrate !== "function") {
        throw new Error(
          `Migration ${file} must export a migrate(db) function`
        );
      }

      db.transaction(() => {
        mod.migrate(db);
        db.run("INSERT INTO _migrations (name, appliedAt) VALUES (?, ?)", [
          file,
          new Date().toISOString(),
        ]);
      })();
    }

    console.log(`  Applied: ${file}`);
    count++;
  }

  if (count === 0) {
    console.log("  Database is up to date.");
  } else {
    console.log(`  ${count} migration(s) applied.`);
  }
}

// Run directly when executed as a script
if (import.meta.main) {
  console.log("Running migrations...");
  runMigrations();
  console.log("Done.");
}
