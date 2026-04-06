## Why

Several OpenSpec capability specs no longer match the implemented application behavior around auth, sessions, admin security, data export, privacy disclosures, and vote throttling. This drift makes the specs less trustworthy as the contract for future changes and increases the chance that later archives or proposals will fail or encode stale assumptions.

## What Changes

- Update existing capability specs to match the current implemented behavior for user sessions, admin sessions, CSRF enforcement, admin login throttling, data export shape, privacy disclosures, and vote cooldown enforcement.
- Remove stale assumptions from specs that still reference GitHub profile fields in exports, SQL-DDL-heavy privacy copy, or pre-hardening auth/session behavior.
- Align public poll voting requirements with the current in-memory vote cooldown behavior.
- Clarify which current behaviors are contract-level requirements vs legacy implementation details that should no longer appear in specs.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `account-data-management`: align export format and account-delete behavior with current hashed-identity-only implementation and CSRF-protected deletion flow.
- `admin-auth`: align admin login, session, CSRF, throttling, expiry, and cookie behavior with the current implementation.
- `hash-identity-system`: align session-signing, auth-cookie, ban-check, and hashed-identity requirements with the current implementation.
- `privacy-page`: replace outdated schema/DDL-oriented privacy requirements with the current plain-language privacy notice behavior.
- `public-poll-views`: align vote submission requirements with the current CSRF, ban re-check, and in-memory cooldown behavior.
- `activity-logging`: align cooldown rejection logging wording with the current in-memory throttle behavior.

## Impact

- **OpenSpec only**: this change mainly updates `openspec/specs/*` to reflect reality.
- **Future changes**: reduces archive/sync failures caused by mismatched requirement headers or stale assumptions.
- **Team workflow**: re-establishes specs as the source of truth for implemented security/privacy behavior.
- **Explicit follow-up docs drift**: `README.md`, `docs/architecture.md`, and `docs/github-oauth.md` still need separate cleanup after the specs are corrected.
