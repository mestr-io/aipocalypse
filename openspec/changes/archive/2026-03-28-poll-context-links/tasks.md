## 1. Database Migration

- [x] 1.1 Create migration `005_poll_links.sql` that adds `links TEXT NOT NULL DEFAULT ''` column to the `polls` table

## 2. Database Layer

- [x] 2.1 Update `CreatePollInput` type in `src/db/queries/polls.ts` to include `links: string`
- [x] 2.2 Update `PollRow`, `PollDetail`, and `PollForEdit` types to include `links: string`
- [x] 2.3 Update `createPoll()` to insert the `links` value
- [x] 2.4 Update `updatePoll()` to persist the `links` value
- [x] 2.5 Update `getPollWithQuestions()` and `getPollForEdit()` SELECT queries to include `links`
- [x] 2.6 Update `docs/models.md` to document the new `links` column on the polls table

## 3. Admin Form & Routes

- [x] 3.1 Add a "Context Links" textarea to the admin poll form in `src/views/admin/poll-form.ts` with placeholder showing `[Label](url)` format
- [x] 3.2 Update `PollFormValues` type to include `links: string`
- [x] 3.3 Update admin POST routes in `src/admin/routes.ts` to parse the `links` field from form body and pass it to `createPoll()` / `updatePoll()`
- [x] 3.4 Update admin GET edit route to pass existing `links` value to the form for pre-population

## 4. Public Poll Detail View

- [x] 4.1 Create a `renderLinks(links: string)` helper in `src/views/poll-detail.ts` that parses `[Label](url)` entries and returns an HTML `<ul>` of `<a>` elements with `target="_blank" rel="noopener noreferrer"`, or empty string if no valid links
- [x] 4.2 Integrate the links section into `pollDetailPage()` between the poll body and the voting options
- [x] 4.3 Ensure all label text and URLs are HTML-escaped via `escapeHtml()`

## 5. Tests

- [x] 5.1 Add tests for `renderLinks()` — valid links, empty input, malformed lines, mixed valid/invalid, XSS escaping
- [x] 5.2 Add tests for poll creation and update with links via database query functions
- [x] 5.3 Add tests for the poll detail page rendering with and without links
- [x] 5.4 Run full test suite (`bun test`) and fix any failures
