## 1. Project Initialization

- [x] 1.1 Create `package.json` with name `aipocalypse`, `type: "module"`, scripts (`dev`, `db:migrate`, `test`), dependency `hono`, and devDependency `@types/bun`
- [x] 1.2 Create `tsconfig.json` with Bun-recommended settings and strict mode enabled
- [x] 1.3 Create `.env.example` with placeholder values for `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_PASSWORD`, and `DATABASE_PATH`
- [x] 1.4 Run `bun install` and verify `bun.lock` is generated

## 2. Database Foundation

- [x] 2.1 Create `src/db/uuid.ts` — UUID v7 generator utility with timestamp-based ordering
- [x] 2.2 Create `src/db/index.ts` — lazy singleton `getDb()` function using `bun:sqlite`, with auto-creation of the `data/` directory
- [x] 2.3 Create `src/db/migrations/001_initial_schema.sql` — CREATE TABLE statements for `users`, `polls`, `questions`, and `answers` with all columns, constraints, CHECK clauses, and indexes per `docs/models.md`
- [x] 2.4 Create `src/db/migrate.ts` — migration runner that tracks applied files in a `_migrations` table, executes new `.sql` files in order inside transactions
- [x] 2.5 Verify `bun run db:migrate` creates the database and all 4 tables with correct schema

## 3. AoC Theme and Layout

- [x] 3.1 Create `src/public/style.css` — dark theme (`#0f0f23` bg), monospace font (`Source Code Pro`), green/gold/grey palette, link styles, responsive max-width layout
- [x] 3.2 Add AoC-style progress bar CSS — `[*******     ]` pattern with gold `#ffff66` stars and dimmed `#333340` remaining space, pure HTML/CSS
- [x] 3.3 Create `src/views/layout.ts` — shared HTML layout function that produces a complete HTML5 document with head (charset, viewport, title, CSS link), navigation bar with "AIPocalypse" title, main content area, and footer

## 4. App Skeleton

- [x] 4.1 Create `src/index.ts` — Hono app entry point that mounts static file serving for `src/public/`, session placeholder middleware, and all route group stubs
- [x] 4.2 Add home page route (`GET /`) returning a styled placeholder page through the layout
- [x] 4.3 Add poll detail route stub (`GET /poll/:id`) returning a styled placeholder through the layout
- [x] 4.4 Add auth route stubs (`GET /auth/login`, `GET /auth/callback`, `GET /auth/logout`) returning placeholder responses
- [x] 4.5 Add vote route stub (`POST /vote/:pollId`) returning 401 (auth not yet implemented)
- [x] 4.6 Add admin route stub (`GET /admin`) returning 401 (auth not yet implemented)
- [x] 4.7 Verify `bun run dev` starts the server on port 3000 and serves a styled home page

## 5. Tests

- [x] 5.1 Create `src/db/uuid.test.ts` — verify UUID v7 format, timestamp encoding, and lexicographic ordering
- [x] 5.2 Create `src/db/migrate.test.ts` — verify migration runner creates tables, skips already-applied migrations, and handles the `_migrations` tracking table
- [x] 5.3 Verify `bun test` runs all tests and passes
