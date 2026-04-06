## 1. Vote cooldown logic

- [x] 1.1 Add a vote-query helper that loads the current answer row and its `updatedAt` timestamp for a user and poll
- [x] 1.2 Implement a 5-second cooldown check using the existing vote row timestamp
- [x] 1.3 Update `POST /vote/:pollId` to reject too-fast repeat writes with `429 Too Many Requests`
- [x] 1.4 Ensure first-time votes are still accepted immediately and successful writes keep updating `updatedAt`

## 2. Logging and user response

- [x] 2.1 Add a structured log event for cooldown rejections with `pollId` and hashed `userId`
- [x] 2.2 Return a short user-facing message telling the voter to wait a few seconds before changing their vote again

## 3. Verification

- [x] 3.1 Add or update Bun tests for first vote allowed, rapid repeat vote rejected, and post-cooldown vote accepted
- [x] 3.2 Add or update route/logging tests for the `429` cooldown response and `user.vote.rejected.cooldown` log event
- [x] 3.3 Run `bun test` and fix any regressions
