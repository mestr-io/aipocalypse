## Context

AIPocalypse already protects vote integrity by requiring authentication, validating CSRF tokens, checking bans, and enforcing one answer row per user and poll. That means hammering `POST /vote/:pollId` cannot create multiple votes for the same account, but it can still generate a large number of unnecessary writes by repeatedly updating the same row.

This change is intentionally small and local: it only targets rapid repeated vote writes from the same authenticated user on the same poll. The app remains a single-process Bun/Hono server using SQLite, so the design should avoid extra infrastructure and avoid schema changes unless absolutely necessary.

## Goals / Non-Goals

**Goals:**
- Reduce pointless write load caused by one account repeatedly posting vote changes in a tight loop.
- Preserve the current product model of “one vote per account per poll” with vote changes still allowed.
- Return a clear, standards-appropriate response when a user hits the cooldown.
- Make cooldown rejections visible in structured logs.

**Non-Goals:**
- Global DDoS protection or protection against many accounts or many IPs.
- Replacing vote changes with immutable first-vote-only behavior.
- Adding Redis, reverse-proxy rate limiting, or any external rate-limit store.
- Adding a database migration just for cooldown tracking.

## Decisions

### 1. Enforce cooldown from the existing `answers.updatedAt` timestamp
**Decision:**
Use the existing `answers.updatedAt` value for the user's current vote on that poll as the source of truth for cooldown timing. Reject a new vote write if fewer than 5 seconds have elapsed since the last write.

**Rationale:**
The table already records when the vote row was last updated. Reusing it avoids schema changes and keeps the rule simple: one write per user per poll every 5 seconds.

**Alternatives considered:**
- Add a separate rate-limit table: more precise, but unnecessary complexity.
- In-memory cooldown map: simpler to code, but resets on process restart and is not reflected in persisted state.

### 2. Allow first vote immediately, throttle only subsequent writes
**Decision:**
If the user has no existing answer row for the poll, allow the vote immediately. Apply the 5-second cooldown only when an existing row is present.

**Rationale:**
The abuse pattern of concern is repeated changes hammering the same row, not normal first-time participation.

### 3. Return `429 Too Many Requests` with a short plain-text message
**Decision:**
When the cooldown is hit, return HTTP 429 and a plain-text message telling the user to wait a few seconds before changing their vote again.

**Rationale:**
`429` matches the semantics of temporary request throttling better than `403`. A simple server-rendered message is enough for the current UX.

**Alternatives considered:**
- Redirect back to the poll page with a query parameter: friendlier, but more plumbing.
- `403 Forbidden`: less precise than `429` for temporary throttling.

### 4. Log cooldown rejections as a dedicated vote event
**Decision:**
Emit a structured log entry such as `user.vote.rejected.cooldown` including `pollId` and hashed `userId` whenever a vote write is rejected by the cooldown window.

**Rationale:**
This gives operators visibility into automated hammering without logging any new PII.

## Risks / Trade-offs

- **[A legitimate user may click twice quickly]** → Return a clear 429 message explaining the brief wait.
- **[Clock-based cooldown depends on server time and ISO timestamp parsing]** → Use server-generated timestamps only and compare in milliseconds.
- **[Cooldown only limits one user on one poll]** → Accept as the intended scope; broader IP-level throttling can be a later change.
- **[Immediate repeated writes across many polls are still possible]** → Accept for now because the main concern is hot-loop abuse on one poll endpoint.

## Migration Plan

1. Add a helper in vote queries to inspect the current answer row and determine cooldown eligibility.
2. Update `POST /vote/:pollId` to reject too-fast repeat writes with `429`.
3. Add structured logging for cooldown rejections.
4. Add tests covering first vote allowed, rapid repeat vote rejected, and vote allowed again after 5 seconds.

**Rollback:**
- No schema migration is involved.
- Rolling back only requires restoring the previous vote route/query logic.

## Open Questions

- Should the cooldown apply only when the selected option differs, or on any repeated write attempt including same-option replays?
- Do we want the 429 response to include a `Retry-After: 5` header, or keep it as a plain minimal response for now?