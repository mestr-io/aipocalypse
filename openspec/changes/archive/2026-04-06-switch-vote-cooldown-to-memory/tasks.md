## 1. In-memory vote throttle

- [x] 1.1 Add a small in-memory helper for vote cooldown timestamps keyed by user and poll
- [x] 1.2 Implement lazy/opportunistic pruning so expired cooldown entries are removed during normal access
- [x] 1.3 Expose a safe way to record an accepted vote write only after SQLite persistence succeeds

## 2. Vote route integration

- [x] 2.1 Update `POST /vote/:pollId` to check the in-memory throttle before hitting SQLite for cooldown enforcement
- [x] 2.2 Keep the existing 5-second cooldown behavior, `429` response, `Retry-After` header, and user-facing message
- [x] 2.3 Preserve cooldown rejection logging with `user.vote.rejected.cooldown`
- [x] 2.4 Remove or stop using DB-based cooldown enforcement helpers that are no longer needed

## 3. Verification

- [x] 3.1 Add or update Bun tests for the in-memory throttle helper, including pruning/reset behavior
- [x] 3.2 Update route tests to verify repeated requests are throttled while first accepted writes still succeed
- [x] 3.3 Run `bun test` and fix any regressions
