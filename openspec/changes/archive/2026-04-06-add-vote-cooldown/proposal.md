## Why

AIPocalypse already enforces one vote per account per poll, but a logged-in user can still hammer the vote endpoint by repeatedly changing the same vote in a tight loop. Adding a short cooldown after each vote change reduces pointless write load on Bun/SQLite and makes automated abuse more expensive without changing the core polling model.

## What Changes

- Add a per-user, per-poll vote cooldown so a user cannot cast or change a vote again until 5 seconds have passed since their last vote write on that poll.
- Return `429 Too Many Requests` when a user attempts to vote again before the cooldown window has elapsed.
- Show a user-friendly message when the vote is rejected due to cooldown.
- Log vote cooldown rejections as structured security/abuse-related events for operator visibility.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `public-poll-views`: change vote submission behavior to enforce a 5-second cooldown between writes for the same user and poll.
- `activity-logging`: add logging for vote requests rejected by the cooldown policy.

## Impact

- **Vote route/query logic**: `src/index.ts` and `src/db/queries/votes.ts` need cooldown checks before updating the stored answer.
- **User-facing poll flow**: cooldown rejections should return a clear response instead of silently failing.
- **Logging**: add a structured log event for cooldown rejections.
- **Tests**: extend vote and route tests to cover cooldown acceptance/rejection timing.