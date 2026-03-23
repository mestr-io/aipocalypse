import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { runMigrations } from "./migrate";

const TEST_DIR = join(import.meta.dirname!, "../../.test-tmp");
const TEST_DB_PATH = join(TEST_DIR, "test-migrate.db");
const TEST_MIGRATIONS_DIR = join(TEST_DIR, "migrations");

/**
 * These tests use a temporary database and migration directory.
 * We override DATABASE_PATH so getDb() creates the test database,
 * and pass a custom migrationsDir to runMigrations().
 */

beforeEach(() => {
  // Clean slate
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_MIGRATIONS_DIR, { recursive: true });

  // Point getDb() at the test database
  process.env.DATABASE_PATH = TEST_DB_PATH;
});

afterEach(() => {
  // Close the singleton so next test gets a fresh connection
  // We need to import closeDb dynamically to reset the singleton
  const { closeDb } = require("./index");
  closeDb();

  rmSync(TEST_DIR, { recursive: true, force: true });
  delete process.env.DATABASE_PATH;
});

describe("runMigrations", () => {
  test("creates _migrations tracking table on first run", () => {
    runMigrations(TEST_MIGRATIONS_DIR);

    const db = new Database(TEST_DB_PATH, { readonly: true });
    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'")
      .all();
    expect(tables).toHaveLength(1);
    db.close();
  });

  test("applies a migration and records it", () => {
    writeFileSync(
      join(TEST_MIGRATIONS_DIR, "001_create_test.sql"),
      "CREATE TABLE test_table (id TEXT PRIMARY KEY, value TEXT);"
    );

    runMigrations(TEST_MIGRATIONS_DIR);

    const db = new Database(TEST_DB_PATH, { readonly: true });

    // Table should exist
    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'")
      .all();
    expect(tables).toHaveLength(1);

    // Migration should be recorded
    const migrations = db.query("SELECT name FROM _migrations").all() as { name: string }[];
    expect(migrations).toHaveLength(1);
    expect(migrations[0]!.name).toBe("001_create_test.sql");

    db.close();
  });

  test("skips already-applied migrations", () => {
    writeFileSync(
      join(TEST_MIGRATIONS_DIR, "001_create_test.sql"),
      "CREATE TABLE test_table (id TEXT PRIMARY KEY);"
    );

    // Run twice
    runMigrations(TEST_MIGRATIONS_DIR);

    // Close and re-open singleton for second run
    const { closeDb } = require("./index");
    closeDb();

    runMigrations(TEST_MIGRATIONS_DIR);

    const db = new Database(TEST_DB_PATH, { readonly: true });
    const migrations = db.query("SELECT name FROM _migrations").all();
    expect(migrations).toHaveLength(1);
    db.close();
  });

  test("applies migrations in alphabetical order", () => {
    writeFileSync(
      join(TEST_MIGRATIONS_DIR, "002_second.sql"),
      "CREATE TABLE second_table (id TEXT PRIMARY KEY);"
    );
    writeFileSync(
      join(TEST_MIGRATIONS_DIR, "001_first.sql"),
      "CREATE TABLE first_table (id TEXT PRIMARY KEY);"
    );

    runMigrations(TEST_MIGRATIONS_DIR);

    const db = new Database(TEST_DB_PATH, { readonly: true });
    const migrations = db
      .query("SELECT name FROM _migrations ORDER BY id")
      .all() as { name: string }[];

    expect(migrations).toHaveLength(2);
    expect(migrations[0]!.name).toBe("001_first.sql");
    expect(migrations[1]!.name).toBe("002_second.sql");

    db.close();
  });

  test("only applies new migrations when some already exist", () => {
    writeFileSync(
      join(TEST_MIGRATIONS_DIR, "001_first.sql"),
      "CREATE TABLE first_table (id TEXT PRIMARY KEY);"
    );

    runMigrations(TEST_MIGRATIONS_DIR);

    // Close singleton so next run gets fresh connection
    const { closeDb } = require("./index");
    closeDb();

    // Add a second migration
    writeFileSync(
      join(TEST_MIGRATIONS_DIR, "002_second.sql"),
      "CREATE TABLE second_table (id TEXT PRIMARY KEY);"
    );

    runMigrations(TEST_MIGRATIONS_DIR);

    const db = new Database(TEST_DB_PATH, { readonly: true });

    const migrations = db.query("SELECT name FROM _migrations").all();
    expect(migrations).toHaveLength(2);

    // Both tables should exist
    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('first_table', 'second_table')")
      .all();
    expect(tables).toHaveLength(2);

    db.close();
  });

  test("reports database is up to date when no new migrations", () => {
    // No migration files — should report up to date without errors
    runMigrations(TEST_MIGRATIONS_DIR);
    // If we get here without throwing, the test passes
    expect(true).toBe(true);
  });
});
