## Why

There is zero structured logging in the application. The only output is 6 bare `console.log` calls for startup and migrations. When something goes wrong in production — a poll gets misconfigured, votes behave unexpectedly, or an admin action has unintended effects — there is no audit trail to trace what happened. Adding structured activity logs for admin and user mutations makes the service observable and debuggable via `journalctl`.

## What Changes

- Add a lightweight logger utility (`src/lib/logger.ts`) that outputs structured JSON lines to stdout with timestamp, level, action, and contextual metadata.
- Add info-level logs at each admin mutation: login, logout, create poll, update poll.
- Add info-level logs at each user mutation: vote cast/changed, data export, account deletion.
- Add info-level logs at auth events: OAuth login (user upsert), logout, banned user rejection.
- No request-level logging. No page visit tracking. Only discrete actions that mutate state or represent significant user-initiated operations.

## Capabilities

### New Capabilities
- `activity-logging`: A structured logger utility and log statements at all admin and user mutation points, outputting JSON lines to stdout for consumption by journalctl.

### Modified Capabilities
<!-- No existing capabilities are modified. This change adds logging calls to existing route handlers but does not change their behavior or requirements. -->

## Impact

- New file: `src/lib/logger.ts`
- Modified files: `src/admin/routes.ts`, `src/index.ts`, `src/auth/routes.ts`
- No new dependencies. No database changes. No API changes.
- Stdout output volume increases (one JSON line per action). This is consumed by journalctl via the Podman/Quadlet service.
