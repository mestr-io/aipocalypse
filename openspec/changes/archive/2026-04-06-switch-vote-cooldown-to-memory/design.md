## Context

AIPocalypse now has a 5-second vote cooldown, but the current implementation reads the existing vote row from SQLite on every vote attempt to decide whether the cooldown applies. That protects the database from repeated writes, but it does not protect the database from repeated reads under a hot loop. In a single-process Bun deployment, an in-memory throttle is a better first-line defense because it can reject repeated requests from the same user and poll before touching SQLite.

The change should preserve the current user-visible behavior: same 5-second cooldown, same `429 Too Many Requests` response, and same logging signal. The main architecture constraint is that the app is a single Bun process using SQLite, so a process-local in-memory structure is acceptable and simpler than adding infrastructure.

## Goals / Non-Goals

**Goals:**
- Reject rapid repeat vote requests from the same user on the same poll before hitting SQLite.
- Preserve the existing 5-second cooldown semantics and user-facing response.
- Keep memory usage bounded with simple pruning.
- Preserve cooldown rejection logging.

**Non-Goals:**
- Distributed throttling across multiple app instances.
- Global rate limiting by IP or protection against volumetric DDoS traffic.
- Durable cooldown state across process restart.
- Changing the one-vote-per-poll data model.

## Decisions

### 1. Use an in-memory map keyed by user and poll
**Decision:**
Store recent accepted vote-write timestamps in a process-local `Map<string, number>` keyed as `<userId>:<pollId>`.

**Rationale:**
This makes the abuse-path check O(1) in memory and avoids SQLite reads for repeated hot-loop requests from the same authenticated user.

**Alternatives considered:**
- Keep DB-based timestamp checks: simpler consistency story, but still hits SQLite every time.
- Key by IP instead of user/poll: less precise and easier to penalize unrelated users behind shared NATs.

### 2. Record cooldown state only after a successful accepted vote write
**Decision:**
Update the in-memory timestamp only after the vote passes validation and is successfully written to SQLite.

**Rationale:**
Rejected or malformed requests should not extend the cooldown window. The map should reflect successful accepted writes only.

### 3. Prune expired entries lazily on access and opportunistically on writes
**Decision:**
When checking or recording a cooldown entry, remove entries older than the cooldown window from the map. No background worker or timer is required.

**Rationale:**
This keeps implementation simple and avoids introducing intervals or lifecycle management for a tiny structure.

### 4. Keep DB timestamps for vote history, but stop using them for throttling
**Decision:**
Continue updating `answers.updatedAt` on successful vote writes, but remove its role in cooldown enforcement.

**Rationale:**
`updatedAt` remains useful audit/history data for the vote row and for existing behavior, while the throttle moves to memory where it is more effective for load shedding.

### 5. Preserve the same user-visible contract and logging event
**Decision:**
Keep:
- 5-second cooldown
- `429 Too Many Requests`
- the same short message
- `Retry-After: 5`
- `user.vote.rejected.cooldown` logs

**Rationale:**
This is an implementation improvement, not a product change.

## Risks / Trade-offs

- **[Cooldown resets on process restart]** → Accept; this is explicitly traded for lower steady-state abuse load.
- **[Multi-instance deployments would not share cooldown state]** → Accept for current single-process deployment; document if scaling later.
- **[Map could grow if pruning is forgotten]** → Centralize cooldown logic in one helper module with pruning built in.
- **[Successful DB write failure after memory update could incorrectly throttle]** → Update the map only after the DB write succeeds.

## Migration Plan

1. Add a small in-memory vote throttle helper/module.
2. Update the vote route to check the in-memory throttle before querying/updating vote state.
3. Record the accepted write timestamp after successful vote persistence.
4. Remove or stop using DB-backed cooldown helpers in vote queries.
5. Update tests to validate memory-based throttling behavior.

**Rollback:**
- No schema changes are involved.
- Rollback is just application-code rollback to the DB-backed cooldown logic.

## Open Questions

- Do we want the in-memory helper to expose a test-only reset function, or should tests re-import the module fresh per run?
- Should future abuse controls combine this with IP-based in-memory throttling on the route as a second line of defense?