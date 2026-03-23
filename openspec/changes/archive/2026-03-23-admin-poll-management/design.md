## Context

The scaffold is complete — Hono app, SQLite database, AoC theme, and route stubs all exist. The admin route currently returns 401 with no actual auth. There are no query functions or admin views. The `ADMIN_PASSWORD` env var is defined but unused. The database schema already has `polls` and `questions` tables ready to receive data.

## Goals / Non-Goals

**Goals:**
- Admin can log in with the `ADMIN_PASSWORD` and maintain a session via a cookie
- Admin can create polls with a title, body, due date, status, and at least 2 answer options — all on one page
- Admin can see a dashboard listing all polls with their status
- Server runs on port 5555

**Non-Goals:**
- Editing or deleting existing polls (future change)
- Public-facing poll display or voting (future change)
- GitHub OAuth for regular users (future change)
- Admin user accounts — single shared password is sufficient for v1

## Decisions

### Admin auth: plain password + signed cookie

The admin authenticates by POSTing the `ADMIN_PASSWORD` value. On success, the server sets an `admin_session` cookie containing an HMAC-signed token (using the password as the signing key). The admin guard middleware verifies this cookie on every `/admin/*` request.

**Why not sessions in the database?** There's only one admin identity. A signed cookie is stateless and simpler — no session table, no cleanup. The cookie is `HttpOnly`, `SameSite=Strict`, and `Path=/admin`.

**Why HMAC and not just storing the password in the cookie?** The password never leaves the server. The cookie contains `hmac(timestamp, ADMIN_PASSWORD)` so it can be verified without comparing plaintext.

### Poll creation: single form with dynamic answer rows

The poll creation form includes fields for title, body, due date, status, and a list of answer options. Answer rows are added/removed with minimal client-side JavaScript (the only JS in the project so far). The form enforces a minimum of 2 answers client-side via validation and server-side via a check before insertion.

**Why client-side JS here?** Adding/removing answer rows dynamically is painful without it. This is the minimal exception to the "no client-side JS" rule — a small inline script that clones a row template.

### Database queries: function-per-operation in `src/db/queries/`

Query functions live in `src/db/queries/polls.ts`. Each function takes explicit parameters and returns typed results. Poll + questions are inserted in a single SQLite transaction.

### Port change: simple constant swap

The port changes from 3000 to 5555 in `src/index.ts`. No configuration abstraction — it's a hardcoded constant.

## Risks / Trade-offs

- **[Single admin password]** → Acceptable for v1 single-operator model. No audit trail of who did what. Mitigated by the fact that this is a small community tool.
- **[Client-side JS for answer rows]** → Breaks the "no client-side JS" ideal. Mitigated by keeping it to a single inline `<script>` block with no dependencies. Progressive enhancement: the form still works with JS disabled if you accept exactly 2 answers.
- **[HMAC cookie expiry]** → The signed token includes a timestamp but has no enforced expiry. If someone gets the cookie, it works until the password changes. Acceptable for admin on a small site.
- **[No CSRF protection]** → Admin forms don't have CSRF tokens yet. Low risk since `SameSite=Strict` cookie prevents cross-origin requests in modern browsers. Can add tokens later.
