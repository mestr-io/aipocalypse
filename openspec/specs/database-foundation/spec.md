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
The project SHALL include `src/db/migrations/001_initial_schema.sql` containing CREATE TABLE statements for `users`, `polls`, `questions`, and `answers` with all columns, constraints, and indexes as defined in `docs/models.md`. The `questions` table SHALL use `position` (not `order`) as the column name for display ordering.

#### Scenario: Schema creates all four tables
- **WHEN** the initial migration runs
- **THEN** the database contains tables `users`, `polls`, `questions`, and `answers` with all columns matching the documented schema

#### Scenario: Indexes are created
- **WHEN** the initial migration runs
- **THEN** indexes `idx_questions_pollId`, `idx_answers_pollId`, `idx_answers_questionId`, and the unique partial index `idx_answers_user_poll` exist

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
