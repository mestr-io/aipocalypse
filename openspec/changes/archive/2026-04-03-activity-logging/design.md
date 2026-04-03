## Context

AIPocalypse has no structured logging. The six existing `console.log` calls cover startup and migrations only. In production, the app runs inside a Podman container managed by Quadlet, with stdout captured by journalctl. Any structured output to stdout is automatically queryable via `journalctl --user -u aipocalypse`.

The app has ~12 mutation points across admin routes (`src/admin/routes.ts`), user routes (`src/index.ts`), and auth routes (`src/auth/routes.ts`). None of them produce any log output today.

## Goals / Non-Goals

**Goals:**
- Make admin and user mutations observable in production logs
- Provide enough context per log line to trace what happened (who, what, when)
- Keep the logger zero-dependency and trivial to maintain
- Output structured JSON so logs are grep-able and parseable by journalctl tooling

**Non-Goals:**
- Request-level logging or access logs (nginx handles this)
- Page visit tracking (explicitly excluded per requirements)
- Log levels beyond info (no debug/trace instrumentation)
- External log aggregation (Loki, Datadog, etc.) — stdout + journalctl is sufficient
- Performance metrics or timing data

## Decisions

### 1. Structured JSON lines to stdout

**Decision**: Each log entry is a single JSON line written to stdout via `console.log(JSON.stringify(...))`.

**Rationale**: The app runs in a Podman container where stdout is captured by journalctl. JSON lines are machine-parseable, grep-friendly, and require no external dependencies. One line per event keeps logs scannable.

**Alternatives considered**:
- Pino/Winston: Adds a dependency for functionality we don't need. The logger is ~20 lines.
- Plain text `console.log`: Not parseable. Can't filter by action or extract metadata.

### 2. Logger as a single utility function

**Decision**: Create `src/lib/logger.ts` exporting a `log` function with signature `log.info(action: string, meta?: Record<string, unknown>)`.

**Rationale**: A single function with an action string and optional metadata is the simplest API that covers all use cases. No log levels beyond `info` needed — we're logging discrete actions, not debugging.

**Output format**:
```json
{"ts":"2025-04-03T10:15:30.123Z","level":"info","action":"admin.poll.created","pollId":"abc123","title":"..."}
```

**Alternatives considered**:
- Hono middleware logger: Logs every request, which we explicitly don't want (no visit tracking). Also doesn't cover the specific action context we need.
- Log at the DB query layer: Too low-level, loses HTTP context (who triggered it). Logging at the route handler level gives us both the action and the actor.

### 3. Log at route handler level, not DB layer

**Decision**: Add log calls in route handlers (`src/admin/routes.ts`, `src/index.ts`, `src/auth/routes.ts`) after successful mutations.

**Rationale**: Route handlers have the full context: the authenticated user, the request parameters, and the outcome. The DB layer only knows about data. Logging after the mutation succeeds avoids logging failed attempts.

### 4. Action naming convention

**Decision**: Dot-separated namespace: `admin.poll.created`, `admin.poll.updated`, `user.vote.cast`, `user.account.deleted`, `auth.login`, `auth.login.banned`.

**Rationale**: Consistent, grep-friendly. `journalctl --user -u aipocalypse | grep '"action":"admin.'` filters all admin activity.

## Risks / Trade-offs

- **[Log volume]** Each vote cast adds a log line. For a small community poll site this is negligible. → No mitigation needed at current scale.
- **[No PII in logs]** Logs must not contain GitHub usernames, tokens, or OAuth data. Only hashed IDs and poll/question IDs. → Enforced by what fields we pass to the logger.
- **[No log rotation]** journalctl handles rotation via systemd journal settings. → No action needed from the app.
