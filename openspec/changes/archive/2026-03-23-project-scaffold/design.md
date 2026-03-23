## Context

AIPocalypse is a greenfield Bun + Hono + SQLite project with full documentation but no source code. The docs define the architecture, database models, OAuth flow, and visual style. This design covers how to scaffold the project so that `bun run dev` serves a styled page and `bun run db:migrate` creates the database — the minimum foundation for feature work.

## Goals / Non-Goals

**Goals:**
- A running Hono server that responds on `http://localhost:3000`
- SQLite database initialized with the 4-table schema (users, polls, questions, answers)
- Migration runner that executes SQL files in order
- Shared HTML layout with the Advent of Code terminal aesthetic
- CSS with dark theme, monospace font, green/gold palette, and AoC-style `[*******     ]` progress bars
- Route stubs for all 5 route groups (`/`, `/poll/:id`, `/auth/*`, `/vote/*`, `/admin/*`)
- Static file serving for CSS and future assets

**Non-Goals:**
- Implementing any feature logic (auth, voting, admin CRUD)
- Session management or cookie handling
- GitHub OAuth integration
- Real data queries — route stubs return placeholder HTML only
- Deployment configuration or production hardening

## Decisions

### Bun project configuration
Use `"type": "module"` in package.json. TypeScript compilation is handled by Bun natively — no `tsc` build step. The `tsconfig.json` extends Bun's recommended config with strict mode enabled. Scripts use `bun run` directly.

**Alternative considered**: Adding a build step with `tsc` — rejected because Bun runs TypeScript natively and a build step adds complexity with no benefit for this project.

### Database connection as a lazy singleton
`src/db/index.ts` exports a `getDb()` function that creates the `Database` instance on first call and reuses it afterward. The database path comes from `DATABASE_PATH` env var with a default of `data/aipocalypse.db`. The `data/` directory is created automatically if it doesn't exist.

**Alternative considered**: Instantiating the Database at module import time — rejected because it would fail during tests or scripts that don't need the database, and it makes the database path harder to override.

### Migration runner approach
Migrations are plain `.sql` files in `src/db/migrations/`, named with a numeric prefix (e.g., `001_initial_schema.sql`). The runner:
1. Creates a `_migrations` table to track which files have been applied.
2. Reads all `.sql` files from the migrations directory, sorted by name.
3. Skips files already recorded in `_migrations`.
4. Executes each new file inside a transaction and records it.

This is invoked via `bun run db:migrate` which calls `src/db/migrate.ts` directly.

**Alternative considered**: Using a migration library — rejected per project constraint (no ORMs or external DB tooling).

### UUID v7 generation
Use a small inline utility in `src/db/uuid.ts` that generates UUID v7 values. UUID v7 encodes a millisecond timestamp in the first 48 bits, giving natural time-ordering. Implementation uses `crypto.randomUUID()` as a base and overwrites the timestamp portion.

**Alternative considered**: Using the `uuid` npm package — rejected to keep dependencies minimal. UUID v7 generation is ~15 lines of code.

### Hono app structure
The entry point `src/index.ts` creates the Hono app, mounts static file middleware for `src/public/`, and defines route groups. Each route group is a separate Hono instance mounted at its prefix, but for the scaffold phase they contain only placeholder responses.

Middleware ordering:
1. Static files (`/public/*`)
2. Session middleware (placeholder — returns empty context for now)
3. Route handlers

### CSS and layout approach
A single `src/public/style.css` file covers the entire application. The layout is a TypeScript function in `src/views/layout.ts` that wraps page content in the shared HTML shell (doctype, head, nav bar, main content area, footer).

AoC-style progress bars use a CSS class `.progress-bar` and are rendered as:
```
[**********          ] 50%
```
Where `*` characters are gold (`#ffff66`) and the remaining space is dimmed grey (`#333340`). This is pure HTML/CSS — no JavaScript.

Color palette:
- Background: `#0f0f23`
- Primary text: `#cccccc`
- Accent green: `#00cc00`
- Highlight gold: `#ffff66`
- Dimmed: `#333340`
- Links: `#009900`

Font: `"Source Code Pro", monospace`

## Risks / Trade-offs

**[Risk] UUID v7 custom implementation may have edge cases** → Mitigated by writing tests for the utility and comparing output format against the spec. The implementation is small and deterministic.

**[Risk] Migration runner has no down-migration support** → Accepted for v1. Forward-only migrations are sufficient for a greenfield project. If needed later, add `down.sql` files.

**[Risk] No hot-reload in dev mode** → Bun's `--hot` flag handles this. The `dev` script uses `bun --hot run src/index.ts`.

**[Trade-off] Single CSS file vs. component-scoped styles** → A single file is simpler and matches the AoC aesthetic (one cohesive theme). Acceptable at this project's scale.
