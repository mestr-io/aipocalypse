## MODIFIED Requirements

### Requirement: Initial schema migration
The initial schema migration (001) defines the foundational tables. A new GDPR migration SHALL alter the `users` and `answers` tables and add the `banned_github_ids` table.

The GDPR migration SHALL:
1. Hard-delete any rows where `deletedAt IS NOT NULL` in `users` and `answers`.
2. Recreate the `users` table without `deletedAt` and `isBanned` columns.
3. Recreate the `answers` table without `deletedAt` and with `ON DELETE CASCADE` on the `userId` foreign key.
4. Create the `banned_github_ids` table.
5. Migrate any existing `isBanned = 1` users into `banned_github_ids` before dropping the column.
6. Preserve all existing indexes.

#### Scenario: Schema creates all four tables
- **WHEN** all migrations (001 through the GDPR migration) have run
- **THEN** the database contains tables: `users` (without `deletedAt` or `isBanned`), `polls`, `questions`, `answers` (without `deletedAt`, with `ON DELETE CASCADE` on userId FK), `banned_github_ids`, and `_migrations`

#### Scenario: Existing banned users are migrated
- **WHEN** the GDPR migration runs on a database containing users with `isBanned = 1`
- **THEN** those users' `githubId` values are inserted into `banned_github_ids` with the migration timestamp

#### Scenario: Soft-deleted rows are purged
- **WHEN** the GDPR migration runs on a database containing users or answers with `deletedAt IS NOT NULL`
- **THEN** those rows are permanently deleted before the column is dropped

#### Scenario: ON DELETE CASCADE is active
- **WHEN** `PRAGMA foreign_keys = ON` is set and a user row is deleted
- **THEN** all `answers` rows referencing that user's `id` are automatically deleted

#### Scenario: Indexes are created
- **WHEN** the GDPR migration has run
- **THEN** the indexes `idx_answers_user_poll` (unique, without deletedAt filter), `idx_answers_pollId`, and `idx_answers_questionId` exist on the `answers` table
