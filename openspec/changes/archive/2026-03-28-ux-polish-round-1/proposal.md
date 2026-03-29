## Why

Several UX rough edges remain after the initial feature build. Related info links clutter the poll list cards, poll detail links use full-bright green that competes with interactive elements, logged-in users have no way to see which polls they already voted on from the home page, the account deletion flow uses a jarring browser `confirm()` dialog, and the account page sections lack visual breathing room. Addressing these together brings the UI closer to a polished AoC-inspired terminal experience.

## What Changes

- **Remove related info links from poll list cards** — `renderLinks()` call removed from `renderCard()` in `poll-list.ts`; links remain on the poll detail page only
- **Restyle poll detail links** — links in `.poll-links` use dimmed green (`#5e8c61`) by default, brightening to `#00cc00` on hover
- **Move related info section** — position it below the vote total, just above "Back to predictions" (already done in code, spec catch-up)
- **Add "voted" badge on poll list cards** — for logged-in users, poll cards they've voted on show a dimmed visual indicator (e.g., a checkmark or "voted" text)
- **Replace browser `confirm()` with inline slide-reveal** — the "Delete my account" button slides left to reveal two buttons: "[No... keep my account]" (green) and "[Yes, delete my account]" (red); pressing "No" slides back to the original button
- **Add spacing between account page sections** — more vertical margin between "Export your data" and "Delete account"

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `public-poll-views`: Poll list cards gain a "voted" badge for logged-in users; related info links removed from poll cards; poll detail links restyled with dimmed green
- `aoc-theme`: New CSS rules for `.poll-links` dimmed/hover, `.voted-badge`, delete slide-reveal animation, account section spacing, `.btn-danger` styling

## Impact

- `src/views/poll-list.ts` — remove `renderLinks` import/call, accept voted poll IDs, render badge
- `src/views/poll-detail.ts` — links section position already moved (spec catch-up only)
- `src/views/account.ts` — replace `onsubmit="return confirm(...)"` with slide-reveal HTML/CSS/JS
- `src/public/style.css` — new rules for `.poll-links`, `.voted-badge`, `.delete-slide`, account section spacing
- `src/db/queries/votes.ts` — new `getUserVotedPollIds(userId)` bulk query
- `src/index.ts` — home route calls `getUserVotedPollIds` and passes result to view
