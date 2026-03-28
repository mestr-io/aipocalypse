## Context

The application currently stores full GitHub profile data (numeric ID, username, display name, avatar URL) for every authenticated user. The recent GDPR compliance change added hard-delete and data export, but the stored data is still PII. This design replaces all stored PII with a single peppered HMAC hash, giving each user a deterministic color-based visual identity instead of their GitHub profile.

Current users table: `id, githubId, name, githubUser, avatarUrl, createdAt, updatedAt`
Target users table: `id, hashedId, createdAt, updatedAt`

The `banned_github_ids` table also stores raw GitHub IDs and must be converted.

## Goals / Non-Goals

**Goals:**
- Eliminate all PII from the database (no GitHub usernames, names, IDs, or avatar URLs stored)
- Derive a stable, unique user identifier from the GitHub ID using HMAC with a server-side pepper
- Give each user a visual three-color identity derived from their hash
- Maintain GDPR data export and deletion capabilities
- Maintain the admin ban system using hashed identifiers
- Migrate existing users in-place without losing their vote history

**Non-Goals:**
- Client-side hash computation (all hashing is server-side)
- Pepper rotation scheme (out of scope; if the pepper leaks, re-deploy with a new one and re-hash — users get new identities but keep their votes)
- Changing the session mechanism (sessions already use internal UUIDv7, unaffected)
- Changing the `answers` table schema (still references `users.id` via FK)

## Decisions

### Decision 1: HMAC-SHA256 truncated to 72 bits (18 hex chars)

**Choice**: `HMAC-SHA256(HASH_PEPPER, githubId.toString())` → take first 18 hex chars of the hex digest.

**Why 72 bits**: The hash is split into three 6-char groups, each interpreted as an HTML color. 3 × 6 hex chars = 18 chars = 72 bits. Collision probability at 1M users is ~10⁻¹⁰ — effectively zero for a poll site.

**Why HMAC over plain hash**: HMAC is the standard construction for keyed hashing. Using `SHA256(pepper + id)` would be vulnerable to length-extension attacks. HMAC is not.

**Why not bcrypt/scrypt**: Those are for password hashing where you want slowness. Here we need fast, deterministic computation on every login. The pepper provides the secrecy; the 200M GitHub ID search space is only crackable if the pepper is known, at which point slowness just adds latency, not security.

**Alternatives considered**:
- Full SHA-256 (64 hex chars): Too long to display. No need for 256 bits of collision resistance.
- 32-bit truncation (8 hex chars): Only produces one color + leftover. Doesn't fit the three-color identity.
- 128-bit truncation (32 hex chars): More than needed, awkward to split into meaningful color groups.

### Decision 2: Three-color visual identity from hash segments

**Choice**: Split the 18-char hash into three 6-char groups. Each group is a valid CSS hex color. Display as `a7f3b2-c1e9d0-4f8baa` with three colored square glyphs (`■`, U+25A0) next to it.

**Rendering in the header**:
```html
<a href="/account">
  <span style="color:#a7f3b2">a7f3b2</span>-<span style="color:#c1e9d0">c1e9d0</span>-<span style="color:#4f8baa">4f8baa</span>
</a> <span style="color:#a7f3b2">■</span><span style="color:#c1e9d0">■</span><span style="color:#4f8baa">■</span>
```

Each segment of the hash text is rendered in its own color, plus three colored squares. The hash IS the visual identity.

**Dark color handling**: No clamping or brightness adjustments. Some hashes will produce dark colors that are hard to see on the dark background. This is accepted — the text is still functional as a link, and true randomness is part of the charm.

### Decision 3: HASH_PEPPER as environment variable

**Choice**: New required env var `HASH_PEPPER`. Should be a random string of at least 32 characters. Used as the HMAC key.

**Why "pepper" not "salt"**: A salt is stored alongside the hash (per-record). A pepper is a secret stored separately (environment only). This is a pepper — it never touches the database.

**Generation**: Users generate it themselves (e.g., `openssl rand -hex 32`). Documented in `.env.example`.

### Decision 4: Rename `banned_github_ids` → `banned_hashed_ids`

**Choice**: The ban table stores `hashedId` (TEXT) instead of `githubId` (INTEGER). Ban checks during OAuth callback compute the hash first, then look up the ban table.

**Admin workflow**: Admin bans users by their `hashedId` as displayed in the system. The admin panel shows user hashes. Since the admin doesn't need to know the GitHub username to ban someone (they identify problematic users by behavior visible on the site), this works.

### Decision 5: Migration strategy

**Choice**: A single SQL migration that:
1. Adds `hashedId TEXT` column to `users`
2. Application code computes hashes for all existing users (requires reading `githubId`, computing HMAC, writing `hashedId`) — this is done in the migration runner as a post-SQL step since SQLite cannot call HMAC
3. Makes `hashedId` NOT NULL and UNIQUE via table rebuild (SQLite doesn't support `ALTER COLUMN`)
4. Drops `githubId`, `name`, `githubUser`, `avatarUrl` columns via table rebuild
5. Creates new `banned_hashed_ids` table, migrates existing bans from `banned_github_ids`, drops old table

**Why a table rebuild**: SQLite doesn't support `DROP COLUMN` before version 3.35.0 and doesn't support adding constraints to existing columns. The standard pattern is CREATE new table → INSERT INTO new FROM old → DROP old → RENAME new.

**Rollback**: This is a one-way migration. Once PII columns are dropped, they cannot be recovered. The rollback plan is: restore from backup before migration.

## Risks / Trade-offs

**[Risk] Pepper loss** → If the `HASH_PEPPER` env var is lost, existing hashes cannot be recomputed for new logins. Users would appear as new users. → Mitigation: Document that the pepper must be backed up. It's as critical as the database itself.

**[Risk] Pepper leak** → If the pepper leaks alongside a DB dump, all hashes are reversible by iterating ~200M GitHub IDs (~0.5 seconds). → Mitigation: Standard secret management practices. The pepper should never be committed to source control or logged.

**[Risk] Some color combinations are visually poor** → Dark-on-dark or nearly identical segments. → Mitigation: Accepted. The hash text is always readable as a link regardless of the color. The colored squares are decorative, not functional.

**[Risk] Admin loses ability to identify users by GitHub username** → Admin only sees hashes. → Mitigation: For a poll site, admins identify problematic users by voting patterns, not GitHub profiles. The hash is a stable identifier for ban management.

**[Risk] Irreversible migration** → PII is permanently deleted. → Mitigation: Document clearly. Take database backup before running. No automated rollback.

**[Trade-off] No profile pictures** → The site loses the visual warmth of GitHub avatars. → The three-color identity is the replacement. It's on-brand for the terminal aesthetic and arguably more distinctive.

**[Trade-off] Data export becomes minimal** → Export now contains only `hashedId`, `createdAt`, and vote history. No GitHub username or profile data. → This is the point — we store less, so there's less to export.
