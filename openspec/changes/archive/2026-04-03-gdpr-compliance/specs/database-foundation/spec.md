## MODIFIED Requirements

### Requirement: Initial schema migration
A GDPR migration SHALL alter the `users` and `answers` tables and add the `banned_github_ids` table.

The migration SHALL:
1. Migrate existing `isBanned = 1` users into `banned_github_ids`.
2. Hard-delete rows where `deletedAt IS NOT NULL` in `users` and `answers`.
3. Recreate `users` without `deletedAt` and `isBanned`.
4. Recreate `answers` without `deletedAt`, with `ON DELETE CASCADE` on userId FK.
5. Create `banned_github_ids` table.
6. Preserve all existing indexes.

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
