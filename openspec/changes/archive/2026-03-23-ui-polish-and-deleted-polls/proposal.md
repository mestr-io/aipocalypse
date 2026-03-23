## Why

The admin dashboard currently hides soft-deleted polls and uses the same dark grey (`#333340`) dimmed color as the public site. This makes secondary text (dates, logout link) nearly invisible. The public site has the same readability issue. Admins also need visibility into deleted polls for audit/recovery purposes.

## What Changes

- **Admin dashboard shows deleted polls**: `listPolls()` includes soft-deleted polls. Deleted rows are visually distinguished with a `[deleted]` badge and strikethrough styling.
- **Admin dimmed color changed to pastel yellow**: All `.dimmed` and secondary text on admin pages uses a warm pastel yellow (`#c8b87a`) instead of `#333340`, improving readability on the dark background.
- **Public site dimmed color changed to pastel green**: All `.dimmed` and secondary text on public pages uses a soft pastel green (`#5e8c61`) instead of `#333340`, staying within the AoC green palette while being more legible.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-poll-crud`: Dashboard now lists deleted polls with visual distinction; `listPolls()` includes soft-deleted records
- `aoc-theme`: Dimmed color split into two context-specific values — pastel yellow for admin, pastel green for public

## Impact

- `src/db/queries/polls.ts` — `listPolls()` query removes the `deletedAt IS NULL` filter on polls, adds `deletedAt` to returned columns
- `src/views/admin/dashboard.ts` — adds `[deleted]` badge and row styling for soft-deleted polls
- `src/public/style.css` — new `.admin-dimmed` class with pastel yellow; public `.dimmed` changes from `#333340` to pastel green; deleted-row styling
- `src/views/admin/*.ts` — admin templates switch from `.dimmed` to `.admin-dimmed`
- `src/views/layout.ts` — public layout retains `.dimmed` (now pastel green)
