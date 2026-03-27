## 1. Database Migration

- [x] 1.1 Verify `PRAGMA foreign_keys = ON` is set in `getDb()` — if not, add it
- [x] 1.2 Create migration 003: migrate `isBanned = 1` users into new `banned_github_ids` table, hard-delete soft-deleted rows, recreate `users` without `deletedAt`/`isBanned`, recreate `answers` without `deletedAt` with `ON DELETE CASCADE`, update indexes
- [x] 1.3 Run migration and verify schema with `bun run db:migrate`

## 2. Ban System Rework

- [x] 2.1 Add ban query functions (`isGithubIdBanned`, `banGithubId`, `unbanGithubId`) in `src/db/queries/users.ts` with tests
- [x] 2.2 Update OAuth callback in `src/auth/routes.ts` to check `banned_github_ids` before `upsertUser`
- [x] 2.3 Remove `isBanned` from the `User` TypeScript interface and session middleware ban check in `src/index.ts`
- [x] 2.4 ~~Update admin ban/unban actions~~ N/A — admin has no existing ban UI; ban functions are available for future use

## 3. User Data Queries

- [x] 3.1 Remove `deletedAt` from User interface, `getUserById`, and `upsertUser`
- [x] 3.2 Remove `deletedAt IS NULL` filters from vote queries in `src/db/queries/votes.ts`
- [x] 3.3 Add `hardDeleteUser(userId)` and `exportUserData(userId)` functions with tests
- [x] 3.4 Update existing user and vote tests for removed `deletedAt` and `isBanned` references

## 4. Privacy Page

- [x] 4.1 Create privacy page view template in `src/views/privacy.ts` with schema display, cookie listing, legal basis, user rights, and repo link
- [x] 4.2 Add `GET /privacy` route in `src/index.ts`
- [x] 4.3 Add footer "Privacy" link to the layout template in `src/views/layout.ts`
- [x] 4.4 Add brief data-policy note near the login link in the nav section of `src/views/layout.ts`

## 5. Account Page (Export & Deletion)

- [x] 5.1 Create account page view template in `src/views/account.ts` with export button, deletion section, and confirmation flow
- [x] 5.2 Add `GET /account` route (authenticated, redirects to login if not), `GET /account/export`, and `POST /account/delete` routes in `src/index.ts`
- [x] 5.3 Add "Account" link to the nav bar for authenticated users in `src/views/layout.ts`

## 6. Final Verification

- [x] 6.1 Run full test suite with `bun test` and fix any failures from migration/schema changes
