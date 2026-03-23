## 1. Database Migration — Rename `order` to `position`

- [x] 1.1 Create `src/db/migrations/002_rename_order_to_position.sql` — table-swap migration that renames `order` to `position` and converts 0-indexed values to 10-based (multiply by 10 + 10)
- [x] 1.2 Update `src/db/queries/polls.ts` — change all `"order"` references to `position` in `createPoll()` and any queries; position starts at 10, increments by 10
- [x] 1.3 Update `src/db/queries/polls.test.ts` — fix tests to assert `position` column with 10-based values instead of 0-indexed `order`
- [x] 1.4 Run `bun run db:migrate` and `bun test` to verify migration and updated queries work

## 2. Documentation Updates

- [x] 2.1 Update `docs/models.md` — rename `order` to `position` in the questions table docs, update column description to note 10-based increments, update example table, update SQL DDL, update notes about quoting

## 3. Public Poll Query Functions

- [x] 3.1 Add `listActivePolls()` to `src/db/queries/polls.ts` — returns active polls ordered by `createdAt DESC` with total `voteCount` from answers table
- [x] 3.2 Add `getPollWithQuestions(pollId)` to `src/db/queries/polls.ts` — returns poll + questions ordered by `position ASC` with per-question `voteCount`, returns `null` if not found or deleted
- [x] 3.3 Add types `ActivePollRow`, `PollDetail`, `QuestionWithVotes` to `src/db/queries/polls.ts`
- [x] 3.4 Write tests for `listActivePolls()` and `getPollWithQuestions()` in `src/db/queries/polls.test.ts`

## 4. Public Views

- [x] 4.1 Create `src/views/poll-list.ts` — renders active poll cards with title link, description preview (first 120 chars), due date, and total vote count
- [x] 4.2 Create `src/views/poll-detail.ts` — renders poll title, full body, due date, answer options with AoC-style `progressBar()` for vote percentages, total vote count text
- [x] 4.3 Add CSS styles for poll cards and poll detail layout in `src/public/style.css`

## 5. Public Routes

- [x] 5.1 Update `GET /` route in `src/index.ts` — call `listActivePolls()` and render with `pollListPage()`
- [x] 5.2 Update `GET /poll/:id` route in `src/index.ts` — call `getPollWithQuestions()`, return 404 if not found or hidden, render with `pollDetailPage()`

## 6. Admin Poll Edit — Query Functions

- [x] 6.1 Add `getPollForEdit(pollId)` to `src/db/queries/polls.ts` — returns poll + questions ordered by position for the edit form, returns `null` if not found or deleted
- [x] 6.2 Add `updatePoll(pollId, input, answers)` to `src/db/queries/polls.ts` — updates poll row, soft-deletes old questions, inserts new questions with 10-based positions, all in a transaction
- [x] 6.3 Write tests for `getPollForEdit()` and `updatePoll()` in `src/db/queries/polls.test.ts`

## 7. Admin Poll Edit — Views and Routes

- [x] 7.1 Extend `adminPollFormPage()` in `src/views/admin/poll-form.ts` to support edit mode — accept optional `pollId` param, change form action to `POST /admin/polls/:id` when editing, change submit button text to "Update Poll"
- [x] 7.2 Update `adminDashboardPage()` in `src/views/admin/dashboard.ts` — make poll title a clickable link to `/admin/polls/:id/edit`
- [x] 7.3 Add `GET /admin/polls/:id/edit` route in `src/admin/routes.ts` — call `getPollForEdit()`, return 404 if not found, render form in edit mode
- [x] 7.4 Add `POST /admin/polls/:id` route in `src/admin/routes.ts` — validate input, call `updatePoll()`, redirect to `/admin` on success, re-render form with errors on failure

## 8. Final Verification

- [x] 8.1 Run full test suite (`bun test`) — all existing and new tests pass
- [ ] 8.2 Manual smoke test — start dev server, verify home page shows polls, poll detail shows progress bars, admin edit flow works end-to-end
