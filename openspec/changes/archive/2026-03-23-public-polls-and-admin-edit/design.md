## Context

AIPocalypse has a working admin panel (login, dashboard, poll creation) and a database schema with users, polls, questions, and answers tables. However, the public site is still a placeholder — there is no way for visitors to browse or view polls. The admin dashboard lists polls but they are not clickable for editing. The `questions.order` column uses a SQL reserved word (requiring quoting everywhere) and 0-indexed sequential values that make reordering painful.

## Goals / Non-Goals

**Goals:**
- Public poll list on the home page showing active polls with vote counts
- Public poll detail page with AoC-style progress bars for vote distribution
- Admin ability to edit existing polls (title, body, due date, status, answer options)
- Rename `questions.order` to `position` with 10-based increments for easier reordering
- Keep the AoC terminal aesthetic consistent across new public views

**Non-Goals:**
- User authentication / voting (GitHub OAuth is a separate future change)
- Real-time vote updates or WebSocket push
- Poll deletion from admin (soft-delete exists but UI is not in scope)
- Poll search or filtering on the public site
- Pagination (poll volume is very small for now)

## Decisions

### 1. Column rename via new migration (not ALTER TABLE)

SQLite does not support `ALTER TABLE ... RENAME COLUMN` cleanly in all versions. We will add a `002_rename_order_to_position.sql` migration that:
1. Creates a new `questions_new` table with `position` instead of `order`
2. Copies data from `questions` with `"order" * 10` to convert to 10-based positioning
3. Drops old `questions` table
4. Renames `questions_new` to `questions`
5. Recreates the index

**Alternative considered**: Using `ALTER TABLE RENAME COLUMN` — rejected because `bun:sqlite` uses a bundled SQLite version and we want maximum compatibility. The table-swap pattern is the safest approach.

### 2. Position increment of 10

New questions start at position 10 and increment by 10 (10, 20, 30...). This leaves gaps for future drag-and-drop reordering without renumbering all rows. The migration multiplies existing `order` values by 10 to maintain relative ordering.

### 3. Vote counts computed via SQL aggregation

`getVoteCounts(pollId)` will return per-question vote counts using `COUNT` + `GROUP BY`. This avoids denormalized counter columns and stays consistent — a single query per poll detail page load. With the expected low volume (dozens of polls, hundreds of votes), this is performant enough.

### 4. Reuse poll-form for both create and edit

The existing `adminPollFormPage()` template will be extended to accept an optional `poll` parameter for edit mode. When present, the form pre-fills all fields and posts to `POST /admin/polls/:id`. This avoids duplicating the form template.

### 5. Public views show percentages but no voter identity

Non-authenticated visitors see: option text, AoC-style progress bar, percentage, and total vote count. No voter names or user links are shown — this is consistent with anonymous polling UX and requires no auth to render.

## Risks / Trade-offs

**[Risk] Table-swap migration loses data if interrupted mid-transaction** → Mitigation: The entire migration runs inside a transaction (as the migration runner already does). If anything fails, it rolls back cleanly.

**[Risk] Reusing the poll form for edit adds complexity** → Mitigation: The form already accepts `values` for re-rendering after validation errors. Edit mode is the same pattern but pre-populated from the database instead of from POST body.

**[Risk] No pagination on public poll list** → Mitigation: With expected single-digit poll counts, pagination is unnecessary. Can be added later without breaking changes.

## Migration Plan

1. Write and test `002_rename_order_to_position.sql`
2. Run `bun run db:migrate` — this is non-destructive (old data is preserved via the table-swap)
3. Update all code references from `"order"` to `position` (no more quoting needed)
4. Deploy new routes and views
5. Rollback: revert migration by creating a `003` that swaps back (unlikely to be needed)
