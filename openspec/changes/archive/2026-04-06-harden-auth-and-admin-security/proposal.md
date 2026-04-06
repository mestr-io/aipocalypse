## Why

AIPocalypse already prevents obvious abuses, but the current security posture still has avoidable gaps: admin access is guarded only by a shared password, sessions do not have explicit expiration controls, state-changing POST routes do not use CSRF tokens, and the privacy copy can be read as overstating how little data is stored. Hardening these areas now reduces the chance of admin compromise, session theft, and user-trust damage before the site sees broader use.

## What Changes

- Harden user and admin session handling with dedicated signing secrets, explicit expiration rules, and `Secure` cookie settings when running over HTTPS.
- Add admin login throttling and failed-login logging to reduce brute-force risk against `POST /admin/login`.
- Add CSRF protection to all state-changing browser forms, including vote submission, account deletion, and admin poll mutations.
- Enforce ban checks on authenticated write actions so a user banned after login cannot continue mutating data with an old session.
- Update privacy disclosures and related UI copy to accurately describe the data that is stored, exported, deleted, and retained in logs.
- **BREAKING**: require dedicated session-signing secrets in deployment configuration instead of reusing `GITHUB_CLIENT_SECRET` and `ADMIN_PASSWORD` for cookie signing.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `admin-auth`: strengthen admin login, cookie/session policy, CSRF defenses, throttling, and failed-auth handling.
- `public-poll-views`: require CSRF protection and ban re-checks on vote submission.
- `account-data-management`: require CSRF protection on account deletion and preserve authenticated account management behavior under the hardened session model.
- `hash-identity-system`: separate user session signing from GitHub OAuth secrets and strengthen cookie/session requirements for authenticated users.
- `privacy-page`: align privacy claims with actual stored data, export/delete behavior, cookies, and logging.
- `activity-logging`: record security-relevant auth failures and rejected state-changing actions without logging PII.

## Impact

- **Auth/session code**: `src/auth/routes.ts`, `src/auth/session.ts`, `src/admin/auth.ts`, `src/admin/middleware.ts`, and shared request handling in `src/index.ts`.
- **Forms and views**: vote form, account deletion form, admin login/form pages, and privacy copy in `src/views/`.
- **Configuration**: `.env.example`, deployment docs, and runtime config loading will need new session-secret variables and possibly rate-limit settings.
- **Logging**: structured security-event logging expands for failed admin logins, CSRF failures, and banned write attempts.
- **Tests**: auth, admin auth, session, and route-level tests need updates for cookie flags, CSRF behavior, throttling, and session expiry.