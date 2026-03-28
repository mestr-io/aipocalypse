## Why

The poll list page (home page) shows a preview of each poll but does not display context links. Links were added to polls in the `poll-context-links` change and are shown on the poll detail page, but voters browsing the home page have no visibility into the reference material before clicking through. Showing links on the poll cards gives voters immediate access to context without an extra click.

## What Changes

- Add the `links` field to the `ActivePollRow` type and the `listPublicPolls()` / `listActivePolls()` SQL queries
- Render context links on each poll card in the home page poll list, between the body preview and the meta row
- Reuse the existing `renderLinks()` helper from `src/views/poll-detail.ts` (already parses `[Label](url)` markdown, escapes HTML, renders `<a target="_blank" rel="noopener noreferrer">`)

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `public-poll-views`: The poll list cards on the home page now display context links when present

## Impact

- `src/db/queries/polls.ts` — `ActivePollRow` type, `listPublicPolls()` and `listActivePolls()` SELECT queries
- `src/views/poll-list.ts` — `renderCard()` function imports and calls `renderLinks()`
- No new dependencies, no breaking changes, no schema migration (column already exists)
