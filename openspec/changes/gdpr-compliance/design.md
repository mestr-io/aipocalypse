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
**Rationale**: The user explicitly signs up (clicks "Login with GitHub") to use the service (voting on polls). We process the minimum data necessary to deliver that service.

### 2. Hard-delete for GDPR erasure, keep soft-delete for content
**Choice**: Remove `deletedAt` from `users` and `answers`. Keep it on `polls` and `questions`.
**Rationale**: GDPR Art. 17 requires actual erasure. `answers.userId` gets `ON DELETE CASCADE`.

### 3. Separate banned_github_ids table
**Choice**: New `banned_github_ids` table. Remove `isBanned` from `users`.
**Rationale**: A banned user can delete their account under GDPR. Bans must survive deletion.

### 4. Privacy page with schema transparency
**Choice**: `/privacy` route showing the literal `CREATE TABLE users` DDL and linking to the GitHub repository.

### 5. Combined account page for export and deletion
**Choice**: Single `/account` route with "Download my data" (JSON) and "Delete my account" (POST with confirmation).

### 6. Login-time transparency notice
**Choice**: Brief, non-blocking note near the login button with a link to `/privacy`.

## Risks / Trade-offs

- **[Aggregate poll results shift on deletion]** → Accepted.
- **[Banned user re-registers after deletion]** → Mitigated by `banned_github_ids` table.
- **[Migration drops deletedAt — no rollback for soft-deleted users]** → Intentional.
- **[ON DELETE CASCADE requires PRAGMA foreign_keys = ON]** → Must verify in `getDb()`.
- **[Schema shown on privacy page could drift from actual schema]** → Acceptable — schema changes are rare.
