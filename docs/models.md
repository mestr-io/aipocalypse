# Database Models

All models are stored in a single SQLite database. Tables use raw SQL managed through `bun:sqlite`. No ORMs.

## Conventions

### Primary keys

All tables use **UUID v7** as their primary key (`id TEXT PRIMARY KEY`). UUID v7 is time-sortable, meaning records are naturally ordered by creation time when sorted by `id`. UUIDs are generated in application code before insertion.

### Timestamps

Every table includes three timestamp columns:

| Column | Type | Description |
|--------|------|-------------|
| `createdAt` | `TEXT NOT NULL` | ISO 8601 timestamp, set on insert |
| `updatedAt` | `TEXT NOT NULL` | ISO 8601 timestamp, set on insert and every update |
| `deletedAt` | `TEXT` | ISO 8601 timestamp, `NULL` when active, set on soft delete |

Timestamps are stored as ISO 8601 strings (e.g., `2026-03-23T14:30:00.000Z`). SQLite has no native datetime type, so text comparison works for ordering and filtering.

### Soft deletes

Records are never physically deleted. Instead, `deletedAt` is set to the current timestamp. **All queries must filter `WHERE deletedAt IS NULL`** unless explicitly dealing with deleted records (e.g., admin audit or recovery).

---

## users

Represents an authenticated user via GitHub OAuth.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` | `PRIMARY KEY` | UUID v7 |
| `githubId` | `INTEGER` | `NOT NULL UNIQUE` | GitHub's numeric user ID |
| `name` | `TEXT` | `NOT NULL` | Display name (from GitHub profile) |
| `githubUser` | `TEXT` | `NOT NULL UNIQUE` | GitHub username (login handle) |
| `avatarUrl` | `TEXT` | `NOT NULL` | GitHub profile picture URL |
| `isBanned` | `INTEGER` | `NOT NULL DEFAULT 0` | `0` = active, `1` = banned |
| `createdAt` | `TEXT` | `NOT NULL` | When the user first logged in |
| `updatedAt` | `TEXT` | `NOT NULL` | Last profile sync or admin action |
| `deletedAt` | `TEXT` | | Soft delete timestamp |

### SQL

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  githubId INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  githubUser TEXT NOT NULL UNIQUE,
  avatarUrl TEXT NOT NULL,
  isBanned INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);
```

### Notes

- `githubId` is the stable identifier from GitHub. Usernames can change, but the numeric ID is permanent.
- `githubUser` is stored for display and lookup, but `githubId` is the foreign key anchor.
- `isBanned` is an integer because SQLite has no native boolean. `0` = false, `1` = true.
- On each GitHub login, the server upserts by `githubId` — updating `name`, `githubUser`, and `avatarUrl` if they changed.
- Banned users can still log in but cannot submit votes. The ban check happens at vote time.
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
| `order` | `INTEGER` | `NOT NULL` | Display position within the poll (0-indexed) |
| `createdAt` | `TEXT` | `NOT NULL` | When the option was created |
| `updatedAt` | `TEXT` | `NOT NULL` | Last edit |
| `deletedAt` | `TEXT` | | Soft delete timestamp |

### SQL

```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  pollId TEXT NOT NULL REFERENCES polls(id),
  body TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE INDEX idx_questions_pollId ON questions(pollId);
```

### Notes

- `order` determines the display sequence. Options are rendered sorted by `order ASC`.
- `order` is a reserved word in SQL, so it must be quoted as `"order"` in queries.
- A poll typically has 3-6 options, but there is no enforced limit.
- Deleting an option (soft delete) does not invalidate existing answers that reference it — they remain as historical records.

### Example

For the poll "Labour Market Impact 2026":

| id | pollId | body | order |
|----|--------|------|-------|
| `019...a1` | `019...p1` | Companies are hiring more than in 2025 | 0 |
| `019...a2` | `019...p1` | No significant changes | 1 |
| `019...a3` | `019...p1` | Accumulated layoffs hit the 10% mark | 2 |
| `019...a4` | `019...p1` | Accumulated layoffs hit the 25% mark | 3 |

---

## answers

Represents a user's vote — their selected option for a given poll.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` | `PRIMARY KEY` | UUID v7 |
| `userId` | `TEXT` | `NOT NULL REFERENCES users(id)` | Who voted |
| `pollId` | `TEXT` | `NOT NULL REFERENCES polls(id)` | Which poll |
| `questionId` | `TEXT` | `NOT NULL REFERENCES questions(id)` | Which option was selected |
| `createdAt` | `TEXT` | `NOT NULL` | When the vote was cast |
| `updatedAt` | `TEXT` | `NOT NULL` | Last modification (if vote change is allowed) |
| `deletedAt` | `TEXT` | | Soft delete timestamp |

### SQL

```sql
CREATE TABLE answers (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  pollId TEXT NOT NULL REFERENCES polls(id),
  questionId TEXT NOT NULL REFERENCES questions(id),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE UNIQUE INDEX idx_answers_user_poll ON answers(userId, pollId) WHERE deletedAt IS NULL;
CREATE INDEX idx_answers_pollId ON answers(pollId);
CREATE INDEX idx_answers_questionId ON answers(questionId);
```

### Constraints

- **One vote per user per poll**: enforced by the unique partial index on `(userId, pollId) WHERE deletedAt IS NULL`. A user can only have one active answer per poll.
- `questionId` must reference a question that belongs to the same `pollId`. This is enforced in application code (not by a database constraint).

### Notes

- When a user votes, an answer row is inserted. If they change their vote (while the poll is still `active`), the existing answer's `questionId` and `updatedAt` are updated — not deleted and re-inserted.
- Banned users (`users.isBanned = 1`) are blocked from creating or updating answers. This is enforced in application code.
- Once a poll moves to `done` status, no new answers are accepted and existing answers cannot be modified.

---

## Entity relationship

```
users 1──────────┐
                  │
                  ▼ (many)
polls 1──┬──── answers
         │        ▲
         │        │
         ▼ (many) │
    questions ────┘
```

- A **user** has many **answers** (one per poll).
- A **poll** has many **questions** (the selectable options).
- A **poll** has many **answers** (one per user).
- An **answer** links one **user** to one **question** within one **poll**.
