## Why

The current vote cooldown reduces repeated writes, but it still queries SQLite on every vote attempt to inspect the existing answer timestamp. For rapid repeated requests from the same authenticated user, an in-memory throttle is more effective because it can reject the request before hitting the database at all.

## What Changes

- Replace the database-backed vote cooldown check with an in-memory per-user/per-poll throttle in the Bun process.
- Keep the 5-second cooldown behavior and `429 Too Many Requests` response semantics the same from the user's perspective.
- Add lazy cleanup or periodic pruning for expired in-memory cooldown entries so the structure stays bounded.
- Continue logging cooldown rejections as structured events.
- **BREAKING**: cooldown state will no longer survive process restarts, because it is intentionally moved out of SQLite and into memory.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `public-poll-views`: change vote cooldown enforcement from persisted timestamp checks to an in-memory throttle while preserving the 5-second user-visible behavior.
- `activity-logging`: preserve cooldown rejection logging under the new in-memory throttle path.

## Impact

- **Vote route logic**: `src/index.ts` should be able to reject rapid repeat requests before querying or updating SQLite.
- **New in-memory helper/module**: likely under `src/` for tracking recent accepted vote writes.
- **Tests**: route and throttle tests need to cover memory-based rejection and cleanup behavior.
- **Operations**: cooldown protection becomes process-local and resets on restart, which should be documented as an intentional trade-off.