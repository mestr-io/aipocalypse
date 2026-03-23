import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { getDb } from "./index";

const MIGRATIONS_DIR = resolve(import.meta.dirname!, "migrations");

/**
 * Run all pending migrations.
 * Tracks applied migrations in a `_migrations` table.
 * Each migration file is executed inside a transaction.
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
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(migrationsDir, file), "utf-8");

    db.transaction(() => {
      db.run(sql);
      db.run("INSERT INTO _migrations (name, appliedAt) VALUES (?, ?)", [
        file,
        new Date().toISOString(),
      ]);
    })();

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
