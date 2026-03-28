## 1. Hash Derivation Core

- [x] 1.1 Create `src/db/hash.ts` with `computeHashedId(githubId: number): string` function — HMAC-SHA256 using `HASH_PEPPER` env var, truncated to 18 hex chars
- [x] 1.2 Add `HASH_PEPPER` validation — throw on startup if not set (add getter function similar to `getClientId`/`getClientSecret` pattern)
- [x] 1.3 Add `HASH_PEPPER` to `.env.example` with generation instructions (`openssl rand -hex 32`)
- [x] 1.4 Write tests for `src/db/hash.ts` — determinism, uniqueness for different IDs, correct length (18 chars), lowercase hex output

## 2. Database Migration

- [ ] 2.1 Create migration SQL file that adds `hashedId TEXT` column to `users` table
- [ ] 2.2 Implement post-SQL migration step that computes hashes for all existing users (read `githubId`, compute HMAC, write `hashedId`)
- [ ] 2.3 Create migration step to rebuild `users` table with only `id`, `hashedId`, `createdAt`, `updatedAt` (dropping PII columns, adding NOT NULL and UNIQUE constraints on `hashedId`)
- [ ] 2.4 Create `banned_hashed_ids` table (`hashedId TEXT PRIMARY KEY`, `bannedAt TEXT NOT NULL`)
- [ ] 2.5 Migrate existing `banned_github_ids` entries — hash each `githubId` and insert into `banned_hashed_ids`
- [ ] 2.6 Drop `banned_github_ids` table
- [ ] 2.7 Add migration guard — abort with clear error if `HASH_PEPPER` is not set

## 3. User Queries Rewrite

- [ ] 3.1 Update `User` type in `src/db/queries/users.ts` — replace `githubId`, `name`, `githubUser`, `avatarUrl` with `hashedId: string`
- [ ] 3.2 Remove `GitHubProfile` type usage from upsert — rewrite `upsertUser` to accept `hashedId: string` instead of `GitHubProfile`, only insert/update `hashedId` and `updatedAt`
- [ ] 3.3 Rewrite ban functions to use `hashedId` — `isHashedIdBanned(hashedId: string)`, `banHashedId(hashedId: string)`, `unbanHashedId(hashedId: string)`
- [ ] 3.4 Update `exportUserData` — return `hashedId` and `createdAt` instead of GitHub profile fields
- [ ] 3.5 Update `UserExport` type to match new export shape
- [ ] 3.6 Update all user query tests for new types and behavior

## 4. Auth Flow Update

- [ ] 4.1 Update OAuth callback in `src/auth/routes.ts` — after fetching GitHub profile, compute `hashedId` from `profile.id`, pass `hashedId` to `upsertUser` instead of full profile
- [ ] 4.2 Update ban check — compute hash first, then call `isHashedIdBanned(hashedId)` before upsert
- [ ] 4.3 Keep `GitHubProfile` type for OAuth response parsing but only use `profile.id` field after hash computation

## 5. Three-Color Identity View Helper

- [ ] 5.1 Create view helper function (in `src/views/layout.ts` or new `src/views/identity.ts`) that takes an 18-char hash and returns HTML with three colored text segments + three colored square glyphs
- [ ] 5.2 Each 6-char segment rendered as `<span style="color:#XXXXXX">XXXXXX</span>`, separated by hyphens, followed by `<span style="color:#XXXXXX">■</span>` for each segment
- [ ] 5.3 Entire hash text wrapped in `<a href="/account">` link

## 6. Header and Account Page Updates

- [ ] 6.1 Update `src/views/layout.ts` — replace `avatar + name + Account + Logout` with the three-color identity helper output for logged-in users
- [ ] 6.2 Update `src/views/account.ts` — show hash identity instead of GitHub profile info, keep export/delete, add logout link
- [ ] 6.3 Update data export route in `src/index.ts` — change download filename from `aipocalypse-data-${user.githubUser}.json` to `aipocalypse-data-${user.hashedId}.json`

## 7. Privacy Page and Admin Updates

- [ ] 7.1 Update `src/views/privacy.ts` — update schema display to show new minimal `users` table (no PII columns)
- [ ] 7.2 Update admin ban/unban routes and views to operate on `hashedId` instead of `githubId`

## 8. Documentation

- [ ] 8.1 Update `docs/models.md` — new `users` schema, new `banned_hashed_ids` table, remove old columns
- [ ] 8.2 Update `docs/architecture.md` — describe hash derivation in auth flow, updated header rendering
- [ ] 8.3 Update `docs/github-oauth.md` — note that profile data is discarded after hash computation

## 9. Testing and Verification

- [ ] 9.1 Run full test suite (`bun test`) and fix any failures from type/schema changes
- [ ] 9.2 Verify migration works on a database with existing users and bans
- [ ] 9.3 Verify login flow end-to-end — new user creation stores only hash, returning user updates only `updatedAt`
