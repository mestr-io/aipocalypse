## MODIFIED Requirements

### Requirement: Initial schema migration
The project SHALL include `src/db/migrations/001_initial_schema.sql` containing CREATE TABLE statements for `users`, `polls`, `questions`, and `answers` with all columns, constraints, and indexes as defined in `docs/models.md`. The `questions` table SHALL use `position` (not `order`) as the column name for display ordering. The `users` table SHALL contain columns `id` (TEXT PRIMARY KEY), `hashedId` (TEXT NOT NULL UNIQUE), `createdAt` (TEXT NOT NULL), and `updatedAt` (TEXT NOT NULL) — no GitHub profile columns.

#### Scenario: Schema creates all four tables
- **WHEN** the initial migration runs
- **THEN** the database contains tables `users`, `polls`, `questions`, and `answers` with all columns matching the documented schema

#### Scenario: Indexes are created
- **WHEN** the initial migration runs
- **THEN** indexes `idx_questions_pollId`, `idx_answers_pollId`, `idx_answers_questionId`, and the unique partial index `idx_answers_user_poll` exist

## ADDED Requirements

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
