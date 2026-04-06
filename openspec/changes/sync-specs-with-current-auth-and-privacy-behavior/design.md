## Context

The codebase has evolved through several security and privacy hardening changes, but not all of those changes were reflected back into the long-lived capability specs under `openspec/specs/`. As a result, some current specs still describe behavior that no longer exists (for example GitHub-profile data in exports, admin sessions signed with `ADMIN_PASSWORD`, or SQL-DDL-heavy privacy copy), while the code now implements CSRF protection, dedicated session secrets, expiring session tokens, admin login throttling, and in-memory vote cooldown enforcement.

This is primarily a contract-repair change. The implementation is already present in the app; the work is to update specs so future proposals, archives, and design decisions build on the actual current behavior instead of stale assumptions.

## Goals / Non-Goals

**Goals:**
- Bring the core auth/privacy/security-related OpenSpec capabilities back into sync with the current implementation.
- Remove stale requirements that would mislead future work or cause archive sync failures.
- Preserve a clear boundary between contract-level behavior and implementation detail.

**Non-Goals:**
- Changing application code as part of this change.
- Updating narrative docs like `README.md` or `docs/*.md` in this change.
- Introducing new product behavior.

## Decisions

### 1. Update existing capability specs instead of adding catch-all documentation specs
**Decision:**
Apply targeted deltas to the existing capabilities that already own the relevant behavior: account data management, admin auth, hash identity system, privacy page, public poll views, and activity logging.

**Rationale:**
The drift exists inside those contracts, so the repair should happen there rather than in a new umbrella spec.

### 2. Treat current code as the source of truth for this sync pass
**Decision:**
Use the current code paths in `src/index.ts`, `src/auth/`, `src/admin/`, `src/views/privacy.ts`, and related query modules as the behavioral baseline.

**Rationale:**
The goal is not to debate desired behavior here; it is to make the specs match implemented reality so later changes can proceed from a clean baseline.

### 3. Capture behavior, not incidental implementation detail
**Decision:**
Specs should describe externally observable or contract-level behavior: session expiry exists, CSRF is required, exports contain hashed identity only, cooldown is enforced from memory. They should not over-specify helper/module names unless needed for clarity.

**Rationale:**
This reduces future drift caused by refactors that preserve behavior.

### 4. Fix known mismatch hotspots first
**Decision:**
Prioritize the capabilities with the most consequential drift:
- `admin-auth`
- `account-data-management`
- `hash-identity-system`
- `privacy-page`
- `public-poll-views`
- `activity-logging`

**Rationale:**
These areas affect security, privacy promises, data export format, and archive sync stability.

## Risks / Trade-offs

- **[Specs may still miss smaller behavioral changes]** → Limit this change to the highest-value drift areas and follow with a docs refresh separately.
- **[Overfitting specs to implementation details]** → Phrase requirements in behavioral terms and avoid naming internal helpers unless the contract truly depends on them.
- **[Archive sync can still fail if requirement headers are edited carelessly]** → Copy full requirement blocks for MODIFIED sections and keep headers aligned exactly.

## Migration Plan

1. Update the selected capability specs to match current code behavior.
2. Validate that the changed specs are internally consistent and archive-friendly.
3. Use the refreshed specs as the baseline for a later README/docs cleanup change.

**Rollback:**
- No application code or schema changes are involved.
- Rollback is just reverting the spec files if needed.

## Open Questions

- Should there be a lightweight process rule in AGENTS/OpenSpec guidance requiring spec updates whenever auth/privacy/export behavior changes?
- After this spec sync, do we want a dedicated follow-up change for `README.md`, `docs/architecture.md`, and `docs/github-oauth.md`?