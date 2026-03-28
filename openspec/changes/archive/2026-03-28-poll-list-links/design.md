## Context

The `poll-context-links` change added a `links TEXT NOT NULL DEFAULT ''` column to the `polls` table and renders links on the poll detail page via `renderLinks()` in `src/views/poll-detail.ts`. The home page poll list (`GET /`) uses `listPublicPolls()` which returns `ActivePollRow` — a type that currently omits the `links` field. The `renderCard()` function in `src/views/poll-list.ts` therefore has no access to link data.

## Goals / Non-Goals

**Goals:**
- Show context links on each poll card in the home page list
- Reuse the existing `renderLinks()` helper — no duplication of link parsing logic

**Non-Goals:**
- Changing link styling or layout on the poll detail page
- Adding link management UI (already handled by admin form)
- Supporting any link format beyond the existing `[Label](url)` markdown

## Decisions

### Reuse `renderLinks()` from poll-detail.ts

Import and call the existing `renderLinks()` in the poll list card renderer. The function already handles empty/malformed input gracefully (returns `""`) and escapes HTML.

**Alternative considered**: A compact variant that renders inline comma-separated links instead of a `<ul>`. Rejected — the `<ul>` is already minimal and consistent with the detail page. The existing `.poll-links` CSS class applies to both locations.

### Add `links` to `ActivePollRow` and both list queries

Both `listPublicPolls()` and `listActivePolls()` need `p.links` in their SELECT clause. `ActivePollRow` gains a `links: string` field. This is a backwards-compatible addition — no callers break since the field is additive.

## Risks / Trade-offs

- **Slightly larger poll cards**: Cards with many links will be taller. Acceptable — most polls will have 0-3 links.
- **Extra column in list query**: Negligible performance impact — `links` is a TEXT column already loaded from the same row.
