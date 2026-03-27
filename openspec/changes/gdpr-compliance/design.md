## Context

AIPocalypse collects personal data via GitHub OAuth: numeric GitHub ID, username, display name, and avatar URL. The session system uses two strictly-necessary cookies (HMAC-signed session token, ephemeral OAuth state). The current schema uses soft-delete (`deletedAt`) across all tables and stores ban state as an `isBanned` column on the `users` table. There is no privacy page, no data export, and no self-service account deletion.

The site is open-source and developer-facing, which creates an opportunity for radical transparency — showing the actual database schema and linking to the repository as proof of claims.

## Goals / Non-Goals

**Goals:**
- GDPR compliance: lawful basis, transparency (Art. 13), right of access (Art. 15), right to erasure (Art. 17), right to data portability (Art. 20).
- A `/privacy` page that explains data practices in plain language, shows the DB schema, and links to source code.
- A `/account` page where authenticated users can export their data as JSON and permanently delete their account.
- Decouple the ban system from user data so bans survive account deletion.
- Simplify the users/answers schema by removing soft-delete (replaced by hard-delete for GDPR erasure).

**Non-Goals:**
- Cookie consent banner — all cookies are strictly necessary (session, CSRF), which are exempt under the ePrivacy Directive.
- GDPR consent-based processing — we use contract performance (Art. 6.1.b) as the legal basis, not consent.
- Data Protection Officer appointment — not required for this scale of processing.
- Automated decision-making disclosures (Art. 22) — we don't do any.
- Removing `deletedAt` from `polls` or `questions` — admin soft-delete for content management is unrelated to GDPR user data concerns.

## Decisions

### 1. Legal basis: Contract performance (Art. 6.1.b)

**Choice**: Contract performance over consent or legitimate interest.

**Rationale**: The user explicitly signs up (clicks "Login with GitHub") to use the service (voting on polls). We process the minimum data necessary to deliver that service. This avoids the complexity of consent withdrawal (Art. 7) and the balancing test required by legitimate interest (Art. 6.1.f).

**Alternatives considered**:
- *Consent (6.1.a)*: Would require a separate consent mechanism, the ability to withdraw consent while keeping the account, and re-consent flows. Overengineered for this use case.
- *Legitimate interest (6.1.f)*: Requires documenting a balancing test. Defensible but unnecessarily complex when contract performance applies cleanly.

### 2. Hard-delete for GDPR erasure, keep soft-delete for content

**Choice**: Remove `deletedAt` from `users` and `answers`. Keep it on `polls` and `questions`.

**Rationale**: GDPR Art. 17 requires actual erasure, not soft-delete. User data and votes must be permanently removed on request. Polls and questions are admin-managed content, not personal data — soft-delete remains useful there for content management.

`answers.userId` gets `ON DELETE CASCADE` so a single `DELETE FROM users WHERE id = ?` wipes both the user and all their votes atomically.

**Alternatives considered**:
- *Soft-delete + scheduled purge*: Adds complexity (cron job, retention window) for no benefit. The user wants immediate deletion and GDPR says "without undue delay."
- *Anonymize instead of delete*: Replace personal fields with placeholders, keep vote data. Possible, but since votes are just a question selection, keeping anonymous votes has minimal analytical value. Clean deletion is simpler.

### 3. Separate banned_github_ids table

**Choice**: New `banned_github_ids` table with just `githubId INTEGER PRIMARY KEY` and `bannedAt TEXT`. Remove `isBanned` from `users`.

**Rationale**: A banned user has the right to delete their account under GDPR. If `isBanned` lives on the user row, deletion erases the ban. A separate table retains only the numeric GitHub ID (a pseudonymous identifier) which is defensible under Art. 17(3) — retention necessary to protect the platform from abuse.

The ban check moves from query-time (`getUserById` filtering) to login-time (checked during OAuth callback, before `upsertUser`).

**Alternatives considered**:
- *Keep isBanned on users, refuse deletion for banned users*: Legally questionable — GDPR doesn't have a "but they were banned" exception, though Art. 17(3)(e) might cover it. Cleaner to separate concerns.
- *Store a hash of the GitHub ID*: Unnecessary indirection. The numeric ID alone is meaningless without GitHub's system.

### 4. Privacy page with schema transparency

**Choice**: A `/privacy` route serving a page that includes the literal `CREATE TABLE users` DDL, explains each cookie by name, states the legal basis, and links to the GitHub repository.

**Rationale**: The audience is developers. Showing the schema is more trustworthy than legal boilerplate. Linking to source code lets anyone verify claims independently. This fits the Advent-of-Code aesthetic.

### 5. Combined account page for export and deletion

**Choice**: A single `/account` route (authenticated) with two actions: "Download my data" (GET endpoint returning JSON) and "Delete my account" (POST with confirmation).

**Rationale**: Art. 15 (access) and Art. 20 (portability) are satisfied by the same JSON export. Art. 17 (erasure) is the delete action. Grouping them on one page is user-friendly and reduces route sprawl.

The export JSON includes human-readable data (username, display name, votes with poll titles) but omits internal IDs. The deletion flow requires a confirmation step (POST, not GET) to prevent accidental erasure.

### 6. Login-time transparency notice

**Choice**: A brief, non-blocking note near the login button: "By logging in you accept our [data policy](/privacy). We store your GitHub username and votes. That's it."

**Rationale**: Art. 13 requires informing the user at the time of data collection. Since our legal basis is contract (not consent), this is informational — not a gate. No checkbox, no popup, no blocking modal.

## Risks / Trade-offs

- **[Aggregate poll results shift on deletion]** → Accepted. When a user deletes their account, their vote is removed, which may slightly change poll percentages. This is the correct behavior — we don't retain anonymous votes. The impact is negligible at any reasonable scale.

- **[Banned user re-registers after deletion]** → Mitigated by `banned_github_ids` table. Ban persists after account deletion. Checked at login time before upsert.

- **[Migration drops deletedAt — no rollback for soft-deleted users]** → Migration will hard-delete any currently soft-deleted users before dropping the column. This is intentional and should be documented in migration comments. At current scale, the number of affected rows is likely zero.

- **[ON DELETE CASCADE requires PRAGMA foreign_keys = ON]** → SQLite disables foreign keys by default. The migration or connection setup must ensure `PRAGMA foreign_keys = ON` is set. Verify this is already configured in `getDb()`.

- **[Schema shown on privacy page could drift from actual schema]** → The displayed schema is a static string in the template. If the schema changes, the privacy page must be updated. This is acceptable — schema changes are rare and deliberate.
