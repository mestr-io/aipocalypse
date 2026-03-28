# Database Models

All models are stored in a single SQLite database. Tables use raw SQL managed through `bun:sqlite`. No ORMs.

## Conventions

### Primary keys

All tables use **UUID v7** as their primary key (`id TEXT PRIMARY KEY`). UUID v7 is time-sortable, meaning records are naturally ordered by creation time when sorted by `id`. UUIDs are generated in application code before insertion.

### Timestamps

Every table includes two timestamp columns:

| Column | Type | Description |
|--------|------|-------------|
| `createdAt` | `TEXT NOT NULL` | ISO 8601 timestamp, set on insert |
| `updatedAt` | `TEXT NOT NULL` | ISO 8601 timestamp, set on insert and every update |

Timestamps are stored as ISO 8601 strings (e.g., `2026-03-23T14:30:00.000Z`). SQLite has no native datetime type, so text comparison works for ordering and filtering.

### Soft deletes (polls and questions only)

The `polls` and `questions` tables use soft deletes via a `deletedAt TEXT` column — `NULL` when active, set to an ISO 8601 timestamp when soft-deleted. Queries on these tables must filter `WHERE deletedAt IS NULL` unless explicitly dealing with deleted records (e.g., admin listing).

The `users` and `answers` tables do **not** use soft deletes. User deletion is a hard delete (with answers cascading via `ON DELETE CASCADE`) to comply with GDPR erasure requirements.

---

## users

Represents an authenticated user identified by a hashed GitHub ID.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` | `PRIMARY KEY` | UUID v7 |
| `hashedId` | `TEXT` | `NOT NULL UNIQUE` | HMAC-SHA256 hash of GitHub numeric ID, truncated to 18 hex chars |
| `createdAt` | `TEXT` | `NOT NULL` | When the user first logged in |
| `updatedAt` | `TEXT` | `NOT NULL` | Last sign-in |

### SQL

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  hashedId TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

### Notes

- `hashedId` is derived from the user's GitHub numeric ID using `HMAC-SHA256(HASH_PEPPER, githubId.toString())`, truncated to 18 hex characters (72 bits). The pepper is a server-side secret (`HASH_PEPPER` env var) that is never stored in the database.
- No PII (name, username, avatar) is stored. The hash serves as the user's visual identity — split into three 6-character segments, each rendered as an HTML color.
- On each GitHub login, the server computes the hash from the GitHub ID, upserts by `hashedId`, and updates only `updatedAt`.
- **No soft deletes** — user deletion is a hard `DELETE` to comply with GDPR Art. 17 (right to erasure). Answers are removed via `ON DELETE CASCADE`.
- Banning is handled by the separate `banned_hashed_ids` table, not a column on `users`. See below.
- The GitHub access token is **not stored** in the database. See [docs/github-oauth.md](github-oauth.md) for the rationale.

---

## polls

Represents a prediction poll with a due date.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` | `PRIMARY KEY` | UUID v7 |
| `name` | `TEXT` | `NOT NULL` | Short title (e.g., "Labour Market Impact 2026") |
| `body` | `TEXT` | `NOT NULL` | Full question text with context and markdown-safe description |
| `dueDate` | `TEXT` | `NOT NULL` | ISO 8601 date when the prediction can be evaluated |
| `status` | `TEXT` | `NOT NULL DEFAULT 'hidden'` | One of: `hidden`, `active`, `done` |
| `createdAt` | `TEXT` | `NOT NULL` | When the poll was created |
| `updatedAt` | `TEXT` | `NOT NULL` | Last edit |
| `deletedAt` | `TEXT` | | Soft delete timestamp |

### SQL

```sql
CREATE TABLE polls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  dueDate TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'hidden' CHECK (status IN ('hidden', 'active', 'done')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);
```

### Status lifecycle

```
hidden  -->  active  -->  done
```

| Status | Visible to users | Accepts votes | Description |
|--------|-----------------|---------------|-------------|
| `hidden` | No | No | Draft state. Admin is still editing. |
| `active` | Yes | Yes | Live poll. Users can see it and vote. |
| `done` | Yes | No | Due date passed or manually closed. Results are final. |

### Notes

- `name` is the headline shown in listings.
- `body` is the full question displayed on the poll detail page (e.g., "What will be the labour market impact at end of year 2026?").
- `dueDate` is a date string (e.g., `2026-12-31`). The app may auto-transition polls from `active` to `done` when the due date passes, or the admin can do it manually.
- Only `active` polls are shown on the public-facing pages. `hidden` polls are only visible in the admin panel.

---

## questions

Represents one selectable option within a poll. Despite the name, these are the **answer choices** — the poll's `body` holds the actual question text.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` | `PRIMARY KEY` | UUID v7 |
| `pollId` | `TEXT` | `NOT NULL REFERENCES polls(id)` | The poll this option belongs to |
| `body` | `TEXT` | `NOT NULL` | The option text (e.g., "Accumulated layoffs hit the 10% mark") |
| `position` | `INTEGER` | `NOT NULL` | Display position within the poll. Starts at 10, increments by 10 (10, 20, 30...) to allow easy insertion between options |
| `createdAt` | `TEXT` | `NOT NULL` | When the option was created |
| `updatedAt` | `TEXT` | `NOT NULL` | Last edit |
| `deletedAt` | `TEXT` | | Soft delete timestamp |

### SQL

```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  pollId TEXT NOT NULL REFERENCES polls(id),
  body TEXT NOT NULL,
  position INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE INDEX idx_questions_pollId ON questions(pollId);
```

### Notes

- `position` determines the display sequence. Options are rendered sorted by `position ASC`.
- Positions start at 10 and increment by 10 (10, 20, 30...) to allow inserting options between existing ones without renumbering.
- A poll typically has 3-6 options, but there is no enforced limit.
- Deleting an option (soft delete) does not invalidate existing answers that reference it — they remain as historical records.

### Example

For the poll "Labour Market Impact 2026":

| id | pollId | body | position |
|----|--------|------|----------|
| `019...a1` | `019...p1` | Companies are hiring more than in 2025 | 10 |
| `019...a2` | `019...p1` | No significant changes | 20 |
| `019...a3` | `019...p1` | Accumulated layoffs hit the 10% mark | 30 |
| `019...a4` | `019...p1` | Accumulated layoffs hit the 25% mark | 40 |

---

## answers

Represents a user's vote — their selected option for a given poll.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` | `PRIMARY KEY` | UUID v7 |
| `userId` | `TEXT` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` | Who voted |
| `pollId` | `TEXT` | `NOT NULL REFERENCES polls(id)` | Which poll |
| `questionId` | `TEXT` | `NOT NULL REFERENCES questions(id)` | Which option was selected |
| `createdAt` | `TEXT` | `NOT NULL` | When the vote was cast |
| `updatedAt` | `TEXT` | `NOT NULL` | Last modification (if vote change is allowed) |

### SQL

```sql
CREATE TABLE answers (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pollId TEXT NOT NULL REFERENCES polls(id),
  questionId TEXT NOT NULL REFERENCES questions(id),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_answers_user_poll ON answers(userId, pollId);
CREATE INDEX idx_answers_pollId ON answers(pollId);
CREATE INDEX idx_answers_questionId ON answers(questionId);
```

### Constraints

- **One vote per user per poll**: enforced by the unique index on `(userId, pollId)`. A user can only have one answer per poll.
- **Cascade on user deletion**: when a user is deleted, all their answers are automatically removed via `ON DELETE CASCADE`.
- `questionId` must reference a question that belongs to the same `pollId`. This is enforced in application code (not by a database constraint).

### Notes

- When a user votes, an answer row is inserted. If they change their vote (while the poll is still `active`), the existing answer's `questionId` and `updatedAt` are updated — not deleted and re-inserted.
- **No soft deletes** — answers are hard-deleted when the user exercises their GDPR right to erasure (cascading from user deletion).
- Banned users (by hashed ID in `banned_hashed_ids`) are blocked at login time — they cannot authenticate, so they cannot create or update answers.
- Once a poll moves to `done` status, no new answers are accepted and existing answers cannot be modified.

---

## banned_hashed_ids

Tracks banned users by their hashed identity. This is separate from the `users` table so bans persist even after account deletion and prevent re-registration.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `hashedId` | `TEXT` | `PRIMARY KEY` | HMAC hash of GitHub numeric ID (same derivation as `users.hashedId`) |
| `bannedAt` | `TEXT` | `NOT NULL` | ISO 8601 timestamp when the ban was applied |

### SQL

```sql
CREATE TABLE banned_hashed_ids (
  hashedId TEXT PRIMARY KEY,
  bannedAt TEXT NOT NULL
);
```

### Notes

- The ban check happens during the OAuth callback, **before** the user is upserted. The server computes the hash from the GitHub profile ID and checks it against this table. A banned hash cannot authenticate at all.
- This table is keyed on `hashedId` (not our internal UUID) so bans survive account deletion. If a banned user deletes their account and tries to re-register, the ban still applies.
- Banning and unbanning are admin operations via `banHashedId()` and `unbanHashedId()` in `src/db/queries/users.ts`.

---

## Entity relationship

```
users 1──────────┐
                  │ ON DELETE CASCADE
                  ▼ (many)
polls 1──┬──── answers
         │        ▲
         │        │
         ▼ (many) │
    questions ────┘

banned_hashed_ids (standalone — keyed on hashedId, not linked to users)
```

- A **user** has many **answers** (one per poll). Deleting a user cascades to all their answers.
- A **poll** has many **questions** (the selectable options).
- A **poll** has many **answers** (one per user).
- An **answer** links one **user** to one **question** within one **poll**.
- **banned_hashed_ids** is a standalone table — it references hashed identities, not internal user IDs, so bans persist across account deletion and re-registration.
