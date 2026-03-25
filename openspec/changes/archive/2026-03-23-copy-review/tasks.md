## 1. Typo Fix

- [x] 1.1 Fix due date: `2925-04-15` → `2025-04-15` — typo was in DB data, not seed script code; fixed directly in DB

## 2. Public Page Copy — Layout

- [x] 2.1 `src/views/layout.ts` — footer: "AIPocalypse — predicting the impact of agentic coding tools" → "AIPocalypse — placing bets on the future of code"

## 3. Public Page Copy — Poll List

- [x] 3.1 `src/views/poll-list.ts` — homepage description: "Community predictions on how agentic coding tools will reshape the developer profession." → "Will AI agents replace us, augment us, or just mass-produce mediocre code? Cast your predictions before reality catches up."
- [x] 3.2 `src/views/poll-list.ts` — empty state: "No active polls right now. Check back soon." → "No active predictions right now. New questions drop regularly."
- [x] 3.3 `src/views/poll-list.ts` — section heading: "Past Polls" → "Past Predictions"
- [x] 3.4 `src/views/poll-list.ts` — status badge: "Closed" → "Sealed"

## 4. Public Page Copy — Poll Detail

- [x] 4.1 `src/views/poll-detail.ts` — auth prompt: "to cast your vote" → "to place your bet"
- [x] 4.2 `src/views/poll-detail.ts` — vote confirmation: "You have voted on this poll. You can change your vote anytime." → "Your prediction is locked in. Change it anytime before the deadline."
- [x] 4.3 `src/views/poll-detail.ts` — button (new vote): "Cast Vote" → "Lock In"
- [x] 4.4 `src/views/poll-detail.ts` — button (change vote): "Change Vote" → "Change Prediction"
- [x] 4.5 `src/views/poll-detail.ts` — back link: "← Back to polls" → "← Back to predictions"
- [x] 4.6 `src/views/poll-detail.ts` — status badge: "Closed" → "Sealed"

## 5. Verification

- [x] 5.1 Run `bun test` to verify no regressions — 69/69 pass
- [x] 5.2 Visual check in browser — homepage, poll detail (logged in), all copy confirmed
