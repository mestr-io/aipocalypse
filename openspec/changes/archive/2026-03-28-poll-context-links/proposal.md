## Why

Polls currently have a title and body, but no way to link to external context (articles, tweets, reports) that explain the topic being predicted. Voters often need background to make informed predictions, and admins have no structured way to attach reference material.

## What Changes

- Add a `links` TEXT column to the `polls` table, storing a markdown-formatted list of links (one per line, `[Label](url)` format)
- Admin poll form gets a textarea for entering context links in markdown format
- Poll detail page renders the links list below the poll body, with each link opening in a new tab (`target="_blank"`)
- Poll creation and update queries read/write the new `links` field
- Existing polls get an empty string default for `links` (non-breaking migration)

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-poll-crud`: Poll creation and edit forms accept a `links` textarea field; create/update queries persist the links column
- `public-poll-views`: Poll detail page renders context links below the body as clickable external links opening in new tabs

## Impact

- **Database**: New migration adds `links TEXT NOT NULL DEFAULT ''` to `polls` table — backward-compatible, no data loss
- **Admin views**: `src/views/admin/poll-form.ts` gets a new textarea field
- **Admin routes**: `src/admin/routes.ts` parses and passes the `links` field
- **Poll queries**: `src/db/queries/polls.ts` — types, create, update, and read functions include `links`
- **Public views**: `src/views/poll-detail.ts` renders links section
- **Docs**: `docs/models.md` updated with new column
