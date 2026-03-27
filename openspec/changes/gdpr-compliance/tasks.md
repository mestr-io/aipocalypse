## 1. Database Migration

- [ ] 1.1 Verify `PRAGMA foreign_keys = ON` is set in `getDb()` — if not, add it
- [ ] 1.2 Create migration 003: migrate `isBanned = 1` users into new `banned_github_ids` table
- [ ] 1.3 Create migration 003: hard-delete rows where `deletedAt IS NOT NULL` in `users` and `answers`
- [ ] 1.4 Create migration 003: recreate `users` table without `deletedAt` and `isBanned` columns
- [ ] 1.5 Create migration 003: recreate `answers` table without `deletedAt`, with `ON DELETE CASCADE` on `userId` FK
- [ ] 1.6 Create migration 003: update `idx_answers_user_poll` unique index (remove `WHERE deletedAt IS NULL` filter)
- [ ] 1.7 Run migration and verify schema with `bun run db:migrate`

## 2. Ban System Rework

- [ ] 2.1 Add `isGithubIdBanned(githubId)` query function in `src/db/queries/users.ts`
- [ ] 2.2 Add `banGithubId(githubId)` and `unbanGithubId(githubId)` query functions
- [ ] 2.3 Update `src/auth/routes.ts` OAuth callback to check `banned_github_ids` before `upsertUser`
- [ ] 2.4 Remove `isBanned` from the `User` TypeScript interface
- [ ] 2.5 Remove `isBanned` ban check from session middleware in `src/index.ts`
- [ ] 2.6 Update admin ban/unban actions to use `banned_github_ids` instead of toggling `isBanned`
- [ ] 2.7 Update existing tests referencing `isBanned`

## 3. User Data Queries

- [ ] 3.1 Remove `deletedAt` from the `User` TypeScript interface and `getUserById` query filter
- [ ] 3.2 Remove `deletedAt = NULL` restoration logic from `upsertUser`
- [ ] 3.3 Remove `deletedAt IS NULL` filters from vote queries in `src/db/queries/votes.ts`
- [ ] 3.4 Add `hardDeleteUser(userId)` function — executes `DELETE FROM users WHERE id = ?` (CASCADE handles answers)
- [ ] 3.5 Add `exportUserData(userId)` function — returns user profile + votes with human-readable poll/question text as JSON-serializable object
- [ ] 3.6 Update existing user and vote tests for removed `deletedAt` and `isBanned` references

## 4. Privacy Page

- [ ] 4.1 Create privacy page view template in `src/views/privacy.ts` with schema display, cookie listing, legal basis, user rights, and repo link
- [ ] 4.2 Add `GET /privacy` route in `src/index.ts`
- [ ] 4.3 Add footer "Privacy" link to the layout template in `src/views/layout.ts`
- [ ] 4.4 Add brief data-policy note near the login link in the nav section of `src/views/layout.ts`

## 5. Account Page (Export & Deletion)

- [ ] 5.1 Create account page view template in `src/views/account.ts` with export button, deletion section, and confirmation flow
- [ ] 5.2 Add `GET /account` route (authenticated, redirects to login if not) in `src/index.ts`
- [ ] 5.3 Add `GET /account/export` route — calls `exportUserData`, returns JSON with `Content-Disposition: attachment`
- [ ] 5.4 Add `POST /account/delete` route — calls `hardDeleteUser`, clears session cookie, redirects to `/`
- [ ] 5.5 Add "Privacy & Data" link to the nav bar for authenticated users in `src/views/layout.ts`

## 6. Testing

- [ ] 6.1 Add tests for `hardDeleteUser` — verify user and answers are deleted, other users unaffected
- [ ] 6.2 Add tests for `exportUserData` — verify JSON structure, omits internal IDs
- [ ] 6.3 Add tests for ban query functions (`isGithubIdBanned`, `banGithubId`, `unbanGithubId`)
- [ ] 6.4 Add tests for OAuth callback ban check — banned user gets rejected
- [ ] 6.5 Run full test suite with `bun test` and fix any failures from migration/schema changes
