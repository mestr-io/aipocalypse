## Why

AIPocalypse requires GitHub login to vote, which means we collect and store personal data (GitHub ID, username, display name, avatar URL). As a service available to EU users, we must comply with the General Data Protection Regulation (GDPR). Today we lack: a privacy policy page, a data export mechanism, a true deletion flow (current soft-delete is not GDPR-compliant erasure), and a cookie disclosure. Addressing this now — before the user base grows — avoids retrofitting under pressure later.

## What Changes

- Add a `/privacy` page with full transparency: what data we store (including the actual DB schema), what cookies we use, the legal basis for processing, and user rights.
- Add a `/account` page (authenticated) where users can download all their data as JSON and permanently delete their account.
- **BREAKING**: Replace soft-delete (`deletedAt`) on `users` and `answers` tables with hard-delete. Account deletion permanently removes the user row and all their votes via `ON DELETE CASCADE`.
- **BREAKING**: Remove `isBanned` column from `users`. Replace with a separate `banned_github_ids` table that persists bans independently of user data, so bans survive account deletion.
- Move ban checks from user-query time to login time (check `banned_github_ids` during OAuth callback).
- Add a brief data-policy notice near the login button and a footer link to `/privacy` on every page.

## Capabilities

### New Capabilities
- `privacy-page`: Public page explaining data collection, cookies, legal basis, user rights, and linking to the source code repository.
- `account-data-management`: Authenticated account page with data export (JSON) and permanent account deletion with confirmation flow.
- `ban-system-rework`: Separate `banned_github_ids` table decoupled from user data; ban checks at login time instead of query time.

### Modified Capabilities
- `database-foundation`: Drop `deletedAt` from `users` and `answers`, drop `isBanned` from `users`, add `ON DELETE CASCADE` on `answers.userId` FK, add `banned_github_ids` table.

## Impact

- **Database**: Migration required — schema changes to `users`, `answers`; new `banned_github_ids` table. Existing soft-deleted users will be hard-deleted by the migration.
- **Auth flow** (`src/auth/routes.ts`): Must check `banned_github_ids` during OAuth callback before upserting user.
- **User queries** (`src/db/queries/users.ts`): Remove `deletedAt` filtering, remove `isBanned` references, add hard-delete and export queries.
- **Views** (`src/views/`): New privacy page template, new account page template, footer update on all pages, login area note.
- **Admin** (`src/admin/`): Ban/unban actions write to `banned_github_ids` instead of toggling `isBanned` on the user row.
- **Tests**: Existing tests referencing soft-delete or `isBanned` need updating.
