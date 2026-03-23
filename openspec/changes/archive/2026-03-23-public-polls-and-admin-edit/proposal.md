## Why

The site currently has no public-facing poll content — the home page shows a static placeholder. Users have no way to browse or view polls. Additionally, the admin panel has no way to edit existing polls, and the `questions.order` column uses a reserved SQL keyword with 0-indexed sequential values that make reordering difficult.

## What Changes

- **Public poll list**: The home page (`GET /`) shows all active polls with title, description preview, due date, and total vote count
- **Public poll detail**: `GET /poll/:id` renders the full poll with answer options displayed as AoC-style `[**** ]` progress bars showing vote percentages. Non-logged-in users see total vote count but not individual voters
- **Admin poll editing**: Polls on the admin dashboard become clickable links. New routes `GET /admin/polls/:id/edit` and `POST /admin/polls/:id` allow editing poll title, body, due date, status, and answer options
- **Rename `order` to `position`**: **BREAKING** — The `questions.order` column is renamed to `position` to avoid the SQL reserved word. Initial position starts at 10 and increments by 10 (10, 20, 30...) to allow easy insertion between existing options
- **New query functions**: `getPollWithQuestions()`, `getVoteCounts()`, `updatePoll()`, and `listActivePolls()` added to `src/db/queries/`

## Capabilities

### New Capabilities
- `public-poll-views`: Public-facing poll list and poll detail pages with vote count display and AoC-style progress bars
- `admin-poll-edit`: Admin ability to edit existing polls including title, body, status, due date, and answer options

### Modified Capabilities
- `admin-poll-crud`: Dashboard poll rows become clickable links to edit form; position field changes affect creation
- `database-foundation`: `questions.order` column renamed to `position`; initial position starts at 10 with increment of 10

## Impact

- **Database**: New migration to rename `order` → `position` and update existing rows to 10-based positioning
- **Routes**: New public routes render poll content; new admin edit routes
- **Views**: New `src/views/poll-list.ts`, `src/views/poll-detail.ts`; modified admin dashboard and poll form
- **Queries**: New and modified functions in `src/db/queries/polls.ts`
- **Documentation**: `docs/models.md` updated to reflect `position` column
- **CSS**: New styles for poll cards, progress bars, vote counts on public pages
