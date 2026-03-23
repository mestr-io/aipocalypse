## 1. CSS Color Changes

- [x] 1.1 Update `.dimmed` class in `src/public/style.css` — change `color` from `#333340` to `#5e8c61` (pastel green) for public pages
- [x] 1.2 Add `.admin-dimmed` class in `src/public/style.css` — `color: #c8b87a` (pastel yellow) for admin secondary text
- [x] 1.3 Add `.deleted-row` styles in `src/public/style.css` — strikethrough on title, `.status-deleted` badge in muted red `#aa4444`

## 2. Admin Template Updates

- [x] 2.1 Update `src/views/admin/dashboard.ts` — replace `.dimmed` with `.admin-dimmed` on date columns, logout link, and empty-state message
- [x] 2.2 Update `src/views/admin/dashboard.ts` — handle deleted polls: add `.deleted-row` class to `<tr>`, show `[deleted]` badge, render title as plain text (no edit link) when `deletedAt` is set
- [x] 2.3 Update `src/views/admin/login.ts` — replace any `.dimmed` usage with `.admin-dimmed`
- [x] 2.4 Update `src/views/admin/poll-form.ts` — replace `.dimmed` usage with `.admin-dimmed`

## 3. Query and Type Changes

- [x] 3.1 Update `PollRow` type in `src/db/queries/polls.ts` — add `deletedAt: string | null` field
- [x] 3.2 Update `listPolls()` in `src/db/queries/polls.ts` — remove `WHERE p.deletedAt IS NULL` filter, add `p.deletedAt` to SELECT list
- [x] 3.3 Update tests in `src/db/queries/polls.test.ts` — add test that `listPolls()` includes soft-deleted polls with `deletedAt` populated

## 4. Verification

- [x] 4.1 Run full test suite (`bun test`) — all existing and new tests pass
- [x] 4.2 Manual smoke test — verify admin dashboard shows deleted polls with strikethrough, pastel yellow dimmed text on admin, pastel green dimmed text on public pages
