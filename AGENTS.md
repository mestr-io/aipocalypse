# AIPocalypse — Agent Instructions

## Project overview

AIPocalypse is a community prediction poll website about the impact of agentic coding tools on the developer profession. It is a server-side rendered web app — no React, no client-side frameworks.

## Tech stack — hard constraints

- **Runtime**: Bun (https://bun.sh/) — NOT Node.js. Never use `node`, `npm`, or `npx`. Always use `bun` and `bunx`.
- **Framework**: Hono (https://hono.dev) — lightweight web framework.
- **Rendering**: Server-side only. Plain HTML templates. No React, no JSX client hydration, no client-side JS frameworks.
- **Database**: SQLite accessed exclusively through `bun:sqlite` (https://bun.sh/docs/api/sqlite). No ORMs, no Drizzle, no Prisma, no better-sqlite3. Import as `import { Database } from "bun:sqlite"`.
- **Testing**: Bun's built-in test runner (https://bun.sh/docs/cli/test). No Jest, no Vitest, no Mocha. Import as `import { test, expect, describe } from "bun:test"`.
- **Auth**: GitHub OAuth for users. Admin panel uses a hardcoded password via `ADMIN_PASSWORD` env var.
- **Style**: Visual homage to Advent of Code — monospace font, dark background, green-on-black terminal aesthetic.

## Commands

| Task | Command |
|------|---------|
| Install dependencies | `bun install` |
| Start dev server | `bun run dev` |
| Run all tests | `bun test` |
| Run a specific test | `bun test <path>` |
| Run database migrations | `bun run db:migrate` |

## Environment variables

Set in `.env` (copy from `.env.example`):

- `GITHUB_CLIENT_ID` — GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` — GitHub OAuth app client secret
- `ADMIN_PASSWORD` — password for the `/admin` panel
- `DATABASE_PATH` — path to the SQLite database file (default: `data/aipocalypse.db`)

## Project structure

```
src/
  index.ts          # Hono app entry point and route definitions
  auth/             # GitHub OAuth flow
  admin/            # Admin panel routes and middleware (password-protected)
  db/               # SQLite schema, migrations, and queries (bun:sqlite)
  views/            # HTML templates (server-side rendered)
  public/           # Static assets (CSS, fonts)
```

## Code conventions

- TypeScript strict mode. No `any` types unless absolutely unavoidable.
- Database queries use raw SQL through `bun:sqlite` — no query builders, no ORMs.
- All database access goes through `src/db/`. No direct `Database` imports outside that directory.
- HTML templates are plain template literals or helper functions in `src/views/`. No templating engines.
- Tests live next to the code they test as `*.test.ts` files.
- No client-side JavaScript unless strictly necessary for form interactions.

## Extended documentation

For detailed information beyond this quick-reference, see:

- **[docs/architecture.md](docs/architecture.md)** — full application architecture, route groups, middleware stack, rendering approach, auth flows, testing strategy, and design aesthetic.
- **[docs/models.md](docs/models.md)** — complete database schema with column definitions, SQL DDL, constraints, indexes, relationships, and usage notes for every model.
- **[docs/github-oauth.md](docs/github-oauth.md)** — GitHub OAuth flow, app registration, endpoints, session management, security checklist, and token storage rationale.

---

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any shell command containing `curl` or `wget` will be intercepted and blocked by the context-mode plugin. Do NOT retry.
Instead use:
- `context-mode_ctx_fetch_and_index(url, source)` to fetch and index web pages
- `context-mode_ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any shell command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` will be intercepted and blocked. Do NOT retry with shell.
Instead use:
- `context-mode_ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### Direct web fetching — BLOCKED
Do NOT use any direct URL fetching tool. Use the sandbox equivalent.
Instead use:
- `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Shell (>20 lines output)
Shell is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `context-mode_ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `context-mode_ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### File reading (for analysis)
If you are reading a file to **edit** it → reading is correct (edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `context-mode_ctx_execute_file(path, language, code)` instead. Only your printed summary enters context.

### grep / search (large results)
Search results can flood context. Use `context-mode_ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `context-mode_ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `context-mode_ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `context-mode_ctx_execute(language, code)` | `context-mode_ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `context-mode_ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `upgrade` MCP tool, run the returned shell command, display as checklist |
