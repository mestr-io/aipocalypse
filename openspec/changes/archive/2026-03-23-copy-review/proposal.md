## Why

The application's user-facing text has grown organically across multiple changes. A review found a typo in the seed data (year "2925" instead of "2025"), generic descriptions that miss the opportunity to set the right tone, and room for punchier copy that matches the AoC terminal aesthetic. Fixing these before launch ensures a polished first impression.

## What Changes

### Syntax / Typo Fixes
- Seed script: due date says `2925-04-15` — should be `2025-04-15`

### Copy Improvements — Public Pages
- **Homepage heading**: "Welcome to AIPocalypse" → "Welcome to AIPocalypse" (keep as-is, it works)
- **Homepage description**: "Community predictions on how agentic coding tools will reshape the developer profession." → "Will AI agents replace us, augment us, or just mass-produce mediocre code? Cast your predictions before reality catches up."
- **Footer tagline**: "AIPocalypse — predicting the impact of agentic coding tools" → "AIPocalypse — placing bets on the future of code"
- **Auth prompt**: "Sign in with GitHub to cast your vote" → "Sign in with GitHub to place your bet"
- **Vote confirmation**: "You have voted on this poll. You can change your vote anytime." → "Your prediction is locked in. Change it anytime before the deadline."
- **Empty polls state**: "No active polls right now. Check back soon." → "No active predictions right now. New questions drop regularly."
- **Past polls heading**: "Past Polls" → "Past Predictions"
- **Poll status badge**: "Closed" → "Sealed" (more thematic — predictions are sealed, not closed)

### Copy Improvements — Buttons & Labels
- "Cast Vote" → "Lock In" (shorter, more decisive)
- "Change Vote" → "Change Prediction"
- "← Back to polls" → "← Back to predictions"

### Copy Consistency
- Nav login link "Sign in with GitHub" — keep as-is (standard OAuth phrasing)
- "vote"/"votes" count labels — keep as-is (factually accurate)

### No Changes (already good)
- Admin panel copy (functional, not themed — correct per conventions)
- Error messages (technical, appropriate)
- Page titles / browser tab text

## Capabilities

### New Capabilities

_None — this is a copy-only change with no new features._

### Modified Capabilities

_None — these are cosmetic text changes that don't alter system behavior or requirements. No spec-level changes needed._

## Impact

- `src/views/layout.ts` — footer tagline
- `src/views/poll-list.ts` — homepage description, empty state, past polls heading, status badge
- `src/views/poll-detail.ts` — auth prompt, vote confirmation, button labels, back link, status badge
- `scripts/seed.ts` — due date typo fix
