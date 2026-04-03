## Requirements

### Requirement: Database connection singleton
The database module SHALL export a `getDb()` function that returns a `bun:sqlite` `Database` instance. The connection SHALL be created lazily on first call and reused on subsequent calls. The database path SHALL come from the `DATABASE_PATH` environment variable, defaulting to `data/aipocalypse.db`.

#### Scenario: First database access creates the connection
- **WHEN** `getDb()` is called for the first time
- **THEN** a new SQLite database file is created at the configured path and the `Database` instance is returned

#### Scenario: Subsequent calls reuse the connection
- **WHEN** `getDb()` is called multiple times
- **THEN** the same `Database` instance is returned each time

#### Scenario: Data directory is created automatically
- **WHEN** the `data/` directory does not exist and `getDb()` is called
- **THEN** the directory is created before opening the database

### Requirement: Migration runner
The project SHALL have a migration runner at `src/db/migrate.ts` that executes SQL migration files in order. It SHALL track applied migrations in a `_migrations` table and skip files already applied. Each migration SHALL run inside a transaction.

#### Scenario: First migration run
- **WHEN** `bun run db:migrate` is executed on a fresh database
- **THEN** the `_migrations` table is created and all SQL files in `src/db/migrations/` are executed in alphabetical order

#### Scenario: Subsequent migration run with no new files
- **WHEN** `bun run db:migrate` is executed and all migrations have already been applied
- **THEN** no SQL is executed and the runner reports that the database is up to date

#### Scenario: New migration file added
- **WHEN** a new `.sql` file is added to `src/db/migrations/` and `bun run db:migrate` is executed
- **THEN** only the new file is executed and recorded in `_migrations`

### Requirement: Initial schema migration
The project SHALL include `src/db/migrations/001_initial_schema.sql` containing CREATE TABLE statements for `users`, `polls`, `questions`, and `answers` with all columns, constraints, and indexes as defined in `docs/models.md`. The `questions` table SHALL use `position` (not `order`) as the column name for display ordering. The `users` table SHALL contain columns `id` (TEXT PRIMARY KEY), `hashedId` (TEXT NOT NULL UNIQUE), `createdAt` (TEXT NOT NULL), and `updatedAt` (TEXT NOT NULL) — no GitHub profile columns.

A GDPR migration SHALL alter the `users` and `answers` tables and add the `banned_github_ids` table. The migration SHALL:
1. Migrate existing `isBanned = 1` users into `banned_github_ids`.
2. Hard-delete rows where `deletedAt IS NOT NULL` in `users` and `answers`.
3. Recreate `users` without `deletedAt` and `isBanned`.
4. Recreate `answers` without `deletedAt`, with `ON DELETE CASCADE` on userId FK.
5. Create `banned_github_ids` table.
6. Preserve all existing indexes.

#### Scenario: Schema creates all four tables
- **WHEN** the initial migration runs
- **THEN** the database contains tables `users`, `polls`, `questions`, and `answers` with all columns matching the documented schema

#### Scenario: Indexes are created
- **WHEN** the initial migration runs
- **THEN** indexes `idx_questions_pollId`, `idx_answers_pollId`, `idx_answers_questionId`, and the unique partial index `idx_answers_user_poll` exist

#### Scenario: Schema after migration
- **WHEN** all migrations have run
- **THEN** `users` has no `deletedAt` or `isBanned`, `answers` has `ON DELETE CASCADE`, `banned_github_ids` exists

#### Scenario: Existing banned users are migrated
- **WHEN** the migration runs on a database with `isBanned = 1` users
- **THEN** those `githubId` values are in `banned_github_ids`

#### Scenario: Soft-deleted rows are purged
- **WHEN** the migration runs with `deletedAt IS NOT NULL` rows
- **THEN** those rows are permanently deleted

#### Scenario: ON DELETE CASCADE is active
- **WHEN** a user row is deleted (with `PRAGMA foreign_keys = ON`)
- **THEN** all `answers` rows referencing that user are automatically deleted

### Requirement: Position column migration
The project SHALL include `src/db/migrations/002_rename_order_to_position.sql` that renames the `questions.order` column to `position` and converts existing 0-indexed values to 10-based positioning.

#### Scenario: Column renamed from order to position
- **WHEN** migration 002 runs
- **THEN** the `questions` table has a `position INTEGER NOT NULL` column and no `order` column

#### Scenario: Existing values converted to 10-based
- **WHEN** migration 002 runs on a database with existing questions having `order` values 0, 1, 2
- **THEN** the corresponding `position` values are 10, 20, 30

#### Scenario: Index preserved
- **WHEN** migration 002 runs
- **THEN** the `idx_questions_pollId` index exists on the new `questions` table

### Requirement: UUID v7 generator
The project SHALL include a utility at `src/db/uuid.ts` that generates UUID v7 strings. The generated UUIDs SHALL be time-ordered and conform to the UUID v7 format.

#### Scenario: Generate a UUID v7
- **WHEN** the UUID generator is called
- **THEN** it returns a string in the format `xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx` where the first 48 bits encode the current millisecond timestamp

#### Scenario: UUIDs are time-ordered
- **WHEN** two UUIDs are generated sequentially
- **THEN** the second UUID sorts lexicographically after the first

### Requirement: Hash identity migration
The project SHALL include a migration that transforms the `users` table from the PII-based schema to the hash-based schema. The migration SHALL: (1) add a `hashedId` column, (2) compute hashes for all existing users using application code (HMAC-SHA256 with `HASH_PEPPER`), (3) rebuild the table to contain only `id`, `hashedId`, `createdAt`, `updatedAt` with proper constraints, (4) create `banned_hashed_ids` table and migrate existing bans from `banned_github_ids` by computing hashes, (5) drop the `banned_github_ids` table.

#### Scenario: Existing users receive hashed IDs
- **WHEN** the migration runs with `HASH_PEPPER` set and existing users in the database
- **THEN** each user's `hashedId` is computed from their `githubId` and the pepper, and the PII columns (`githubId`, `name`, `githubUser`, `avatarUrl`) are removed

#### Scenario: Existing bans are migrated
- **WHEN** the migration runs with existing entries in `banned_github_ids`
- **THEN** each ban's `githubId` is hashed and inserted into `banned_hashed_ids`, and the `banned_github_ids` table is dropped

#### Scenario: Migration fails without HASH_PEPPER
- **WHEN** the migration runs without `HASH_PEPPER` set
- **THEN** the migration aborts with an error message indicating that `HASH_PEPPER` is required

#### Scenario: Vote history is preserved
- **WHEN** the migration runs with existing users who have votes
- **THEN** the `answers` table foreign key references (`userId`) remain intact because the internal `id` column is unchanged
