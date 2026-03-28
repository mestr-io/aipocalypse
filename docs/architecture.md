# Architecture

## Overview

AIPocalypse is a server-side rendered web application built with Hono on the Bun runtime. There is no client-side framework — every page is rendered on the server as plain HTML and served to the browser. The database is a local SQLite file accessed through `bun:sqlite`.

The architecture is deliberately simple: a single Bun process handles HTTP requests, renders HTML, manages auth, and reads/writes to SQLite. No background workers, no message queues, no external services beyond GitHub OAuth.

## Runtime

**Bun** (https://bun.sh/) is the only supported runtime. Node.js is not used. All CLI commands use `bun` — never `node`, `npm`, or `npx`.

Bun provides:
- The HTTP server (via Hono)
- The SQLite driver (`bun:sqlite`)
- The test runner (`bun:test`)
- The package manager (`bun install`)

## Web framework

**Hono** (https://hono.dev) handles routing, middleware, and request/response lifecycle. It runs on Bun's built-in HTTP server.

### Route groups

| Route prefix | Purpose | Auth |
|-------------|---------|------|
| `/` | Home page — all active polls grouped in a list | None |
| `/poll/:id` | Individual poll page — results, voters, timeline | None (view) / GitHub OAuth (vote) |
| `/privacy` | Privacy policy page — GDPR transparency | None |
| `/account` | Account management — data export and deletion | GitHub OAuth (logged in) |
| `/account/export` | Download personal data as JSON | GitHub OAuth (logged in) |
| `/account/delete` | Permanently delete account (POST) | GitHub OAuth (logged in) |
| `/auth/*` | GitHub OAuth flow (login, callback, logout) | None |
| `/vote/*` | Voting endpoints (POST) | GitHub OAuth (logged in) |
| `/admin/*` | Admin panel — poll CRUD, user management | Password (`ADMIN_PASSWORD` env var) |

### Middleware stack

1. **Static files** — serves `src/public/` assets (CSS, fonts).
2. **Session** — cookie-based session handling for authenticated users. Loads the user from the database by session ID. Does **not** check ban status (ban checks happen at login time only).
3. **Auth guard** — protects `/vote/*` and `/account/*` routes; redirects to GitHub login if unauthenticated.
4. **Admin guard** — protects `/admin/*` routes; requires password authentication.

## Pages and visibility

### Home page (`/`)

Displays all **active** polls grouped in a list. Visible to everyone — no login required.

Each poll card shows the poll name, due date, and current status. Non-logged-in users can browse all polls but cannot vote. A "Sign in with GitHub" prompt is shown where the vote action would be.

### Poll page (`/poll/:id`)

The detail page for a single poll. Visible to everyone, but the experience differs by auth state:

**All visitors (logged in or not) can see:**
- The poll question and all answer options
- Aggregate vote counts per option

**Logged-in users additionally see:**
- A voting form (or their current vote if already cast)
- **Who voted on each answer** — up to 10 user avatars/names shown per option. If more than 10 users voted for an option, a "+N more" indicator is displayed.
- **Responses over time** — a text-based timeline chart showing how votes accumulated over time, rendered in the Advent of Code ASCII-art style (no JavaScript charting libraries — server-rendered monospace graphics).

**Non-logged-in users see:**
- A prompt to sign in to vote and see detailed voter information.

### Voting (`POST /vote/:pollId`)

Authenticated-only endpoint. Accepts a `questionId` (the selected option) and creates or updates the user's answer for that poll. Redirects back to the poll page.

## Rendering

All HTML is server-side rendered using **plain TypeScript template literals**. No templating engines (Handlebars, EJS, Pug, etc.) and no client-side frameworks (React, Vue, Svelte, etc.).

Templates live in `src/views/` and export functions that return HTML strings:

```typescript
export function pollPage(poll: Poll, questions: Question[]): string {
  return `
    <html>
      <head>...</head>
      <body>
        <h1>${poll.name}</h1>
        ...
      </body>
    </html>
  `;
}
```

### Layout

A shared layout wrapper provides the common HTML shell (head, navigation, footer) with the Advent of Code-inspired terminal aesthetic. Individual page templates plug into this layout.

### Client-side JavaScript

Avoided unless strictly necessary. When needed (e.g., form interactions), it is minimal inline `<script>` — never a bundled framework.

## Database

**SQLite** via `bun:sqlite` (https://bun.sh/docs/api/sqlite). The database is a single file stored at the path specified by `DATABASE_PATH` (default: `data/aipocalypse.db`).

### Constraints

- No ORMs. No Drizzle, Prisma, or better-sqlite3.
- All queries are raw SQL strings executed through `bun:sqlite`.
- All database access is encapsulated in `src/db/`. No other directory imports `Database` directly.

### Migrations

Migrations are plain SQL files or TypeScript files stored in `src/db/migrations/` and executed in order via `bun run db:migrate`. SQL files are named with a sequential prefix (e.g., `001_initial_schema.sql`). TypeScript migrations (`.ts`) must export a `migrate(db)` function and are used when application-level logic is needed during migration (e.g., computing hashes).

### Soft deletes

The `polls` and `questions` tables use a `deletedAt` column. These records are never physically deleted — they are marked with a timestamp. Queries on these tables must filter on `deletedAt IS NULL` unless explicitly querying deleted records (e.g., admin recovery).

The `users` and `answers` tables do **not** use soft deletes. User accounts are hard-deleted (with CASCADE to answers) to comply with GDPR data erasure requirements. The `banned_hashed_ids` table also has no soft delete — entries are inserted or removed directly.

### UUIDs

All primary keys are **UUID v7** strings. UUID v7 is time-ordered, which gives natural chronological sorting and good index performance in SQLite. Generated in application code, not by the database.

## Authentication

### Users (GitHub OAuth)

Regular users authenticate via **GitHub OAuth Apps** using the standard authorization code flow:

1. User clicks "Sign in with GitHub" and is redirected to GitHub's authorization page.
2. GitHub redirects back to `/auth/callback` with an authorization code.
3. The server exchanges the code for an access token, fetches the user's GitHub profile, computes an HMAC-SHA256 hash of the GitHub numeric ID, and upserts a record in the `users` table using only the hash.
4. A session cookie is set to keep the user logged in. The access token and all profile data (name, username, avatar) are discarded — only the hash is stored.

The app requests **no OAuth scopes**, giving read-only access to the user's public profile. Only the numeric `id` field is used — all other profile fields are discarded after hash computation.

For the full flow, endpoints, security considerations, and setup instructions, see **[docs/github-oauth.md](github-oauth.md)**.

Required environment variables:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### Admin (password)

The admin panel at `/admin` uses a simple password form. The password is set via the `ADMIN_PASSWORD` environment variable. No user accounts, no OAuth — just a single shared secret for v1.

The admin session is stored in a separate cookie from the user session.

## Testing

All tests use **Bun's built-in test runner** (https://bun.sh/docs/cli/test). No Jest, Vitest, or Mocha.

```typescript
import { test, expect, describe } from "bun:test";
```

Tests live next to the code they test as `*.test.ts` files:

```
src/
  db/
    queries.ts
    queries.test.ts
  auth/
    github.ts
    github.test.ts
```

Run all tests:

```bash
bun test
```

Run a specific test file:

```bash
bun test src/db/queries.test.ts
```

## Environment variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app client ID | — |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app client secret | — |
| `ADMIN_PASSWORD` | Yes | Password for `/admin` panel | — |
| `HASH_PEPPER` | Yes | HMAC key for hashing GitHub IDs. Generate with `openssl rand -hex 32`. Must be kept secret. | — |
| `DATABASE_PATH` | No | Path to SQLite database file | `data/aipocalypse.db` |

Copy `.env.example` to `.env` and fill in the values.

## Project structure

```
src/
  index.ts              # Hono app entry, route definitions, server start
  auth/                 # GitHub OAuth flow (login, callback, logout)
  admin/                # Admin panel routes, middleware, views
  db/                   # Database module
    index.ts            # Database connection singleton
    migrate.ts          # Migration runner (uses db.exec for multi-statement SQL)
    migrations/         # Sequential SQL migration files
    queries/            # Query functions grouped by model
  views/                # HTML template functions
    layout.ts           # Shared HTML shell (head, nav, footer)
    privacy.ts          # Privacy policy page
    account.ts          # Account management page (data export, deletion)
    pages/              # Individual page templates
  public/               # Static assets served directly
    style.css           # Advent of Code-inspired terminal aesthetic
data/                   # SQLite database file (gitignored)
docs/                   # Extended documentation
  architecture.md       # This file
  models.md             # Database model reference
  github-oauth.md       # GitHub OAuth flow reference
  hosting.md            # Hetzner VPS deployment guide
```

## Design aesthetic

The visual style is a direct homage to **Advent of Code** (https://adventofcode.com/):

- Dark background (`#0f0f23` or similar)
- Green-on-black terminal text (`#00cc00`)
- Monospace font (Source Code Pro or similar)
- Minimal chrome — no heavy UI components, no rounded cards, no gradients
- Star/highlight accents in gold (`#ffff66`) for emphasis
- ASCII-art influenced headings and decorations
