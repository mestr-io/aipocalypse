## Why

The GDPR compliance change reduced our exposure, but we still store personally identifiable information (GitHub ID, username, display name, avatar URL) for every user. A database leak would expose which GitHub accounts hold which poll opinions. We can go further: replace all PII with a single peppered HMAC hash of the GitHub ID, making the stored data meaningless without the server-side secret. Users get a unique three-color visual identity derived from their hash instead of their GitHub profile.

## What Changes

- **BREAKING**: Drop columns `githubId`, `name`, `githubUser`, and `avatarUrl` from the `users` table. Replace with a single `hashedId` column (18 hex chars, derived from `HMAC-SHA256(HASH_PEPPER, githubId)` truncated to 72 bits).
- **BREAKING**: Rename `banned_github_ids` table to `banned_hashed_ids`, storing peppered hashes instead of raw GitHub IDs.
- **BREAKING**: Replace the header's avatar + username + Account + Logout with a hash-derived color identity: the 18-char hash displayed as `a7f3b2-c1e9d0-4f8baa` with three colored squares (each 6-char segment is a direct HTML color), linking to the account page.
- Account page changes from displaying GitHub profile info to showing the hash identity with colored squares, plus export/delete/logout.
- Data export returns the hash and votes only (no GitHub username, name, or avatar).
- Privacy page updated to reflect the minimal schema.
- New `HASH_PEPPER` environment variable (required, secret) used as the HMAC key for deriving hashed IDs.
- OAuth callback flow changes: GitHub profile data is received, hash is computed, profile data is discarded (never stored).
- Migration computes hashes for existing users in-place before dropping PII columns.

## Capabilities

### New Capabilities
- `hash-identity-system`: The HMAC-based hashing scheme, pepper configuration, hash derivation function, and the three-color visual identity rendering (splitting 18 hex chars into 3 color segments displayed as colored squares).

### Modified Capabilities
- `database-foundation`: Users table schema changes (drop PII columns, add `hashedId`), banned table renamed and re-keyed, new migration file.
- `aoc-theme`: Header changes from avatar+name+links to colored hash identity link. Account page visual changes.

## Impact

- **Database**: Migration required — adds `hashedId` to users, computes values for existing rows, drops `githubId`/`name`/`githubUser`/`avatarUrl` columns, renames `banned_github_ids` to `banned_hashed_ids` and converts stored IDs to hashes.
- **Environment**: New required `HASH_PEPPER` env var. Must be set before migration runs (migration needs it to compute hashes for existing users).
- **Auth flow** (`src/auth/routes.ts`): OAuth callback computes hash from `profile.id`, discards profile data. Ban check uses hashed ID.
- **User queries** (`src/db/queries/users.ts`): Complete rewrite of `User` type, `upsertUser`, ban functions, export function. `GitHubProfile` type kept but only `id` field is used post-hash.
- **Views** (`src/views/layout.ts`, `src/views/account.ts`, `src/views/privacy.ts`): Header, account page, and privacy page all updated for hash-only identity.
- **Admin** (`src/admin/`): Ban/unban operates on hashed IDs. Admin views show hashes instead of usernames.
- **Docs** (`docs/models.md`, `docs/architecture.md`): Schema documentation, auth flow description updated.
- **Tests**: User query tests, auth tests need updating for new types and hash-based identity.
