## Context

AIPocalypse is a single-process Bun/Hono app with server-rendered HTML, cookie-based authentication, and SQLite-backed user/vote data. The current implementation already uses signed cookies and server-side GitHub OAuth, but it still has a few security weaknesses that cut across multiple modules:

- user sessions are signed with `GITHUB_CLIENT_SECRET`
- admin sessions are signed with `ADMIN_PASSWORD`
- admin sessions never expire server-side
- auth-related cookies do not explicitly set `Secure`
- state-changing forms do not carry CSRF tokens
- admin login has no throttle against password guessing
- ban checks happen at login time but not again on vote submission
- privacy copy understates what data is actually stored

This is a cross-cutting security change touching auth, admin, views, configuration, and logging. The app remains intentionally simple: no external cache, no third-party auth/session service, no client-side framework, and no long-lived server-side session store.

## Goals / Non-Goals

**Goals:**
- Separate OAuth secrets, admin password verification, and cookie signing into distinct concerns.
- Make user and admin sessions explicitly time-bounded and harder to steal/reuse.
- Add practical CSRF protection to all browser-driven mutation routes without introducing a database-backed session store.
- Add best-effort brute-force protection for admin login that fits the single-process architecture.
- Ensure a user banned after login cannot continue voting with an already-issued session.
- Update privacy disclosures so they accurately match stored data and security logging behavior.

**Non-Goals:**
- Replacing admin password auth with OAuth, TOTP, or a full admin account system.
- Introducing Redis, a shared rate-limit service, or any external dependency.
- Converting the app to server-side stored sessions.
- Blocking banned users from exporting or deleting their own data.
- Solving “one human, one vote” across multiple GitHub accounts.

## Decisions

### 1. Use dedicated secrets for each trust boundary
**Decision:**
Add `SESSION_SECRET` for user-session signing and `ADMIN_SESSION_SECRET` for admin-session signing. Keep `GITHUB_CLIENT_SECRET` only for the OAuth token exchange, and keep `ADMIN_PASSWORD` only for password verification.

**Rationale:**
Reusing secrets across unrelated trust boundaries increases blast radius. A leak of the GitHub OAuth client secret should not also allow forged local sessions. Knowing the admin password should not automatically imply the ability to mint arbitrary admin session cookies.

**Alternatives considered:**
- Reuse existing secrets: simpler, but keeps the current coupling and risk.
- Add a single shared `APP_SECRET`: better than today, but still needlessly couples admin and user sessions.

### 2. Keep stateless HMAC-signed cookies, but make them explicit and expiring
**Decision:**
Keep the current stateless cookie approach, but change token payloads to include expiration and verify expiry server-side.

- User session token: signed payload containing `userId` and `exp`, with a 30-day lifetime to preserve current UX.
- Admin session token: signed payload containing `iat`, `exp`, and a nonce, with a short absolute lifetime (12 hours).

Use constant-time signature comparison.

**Rationale:**
The app is intentionally simple and single-process. Stateless signed cookies fit that model and avoid introducing a session table. Adding expiry gives the app a real server-side validity check instead of trusting the browser cookie lifetime alone.

**Alternatives considered:**
- Database-backed sessions: stronger revocation, but more complexity and schema/runtime overhead.
- Very short user sessions: safer, but unnecessary friction for normal voting flows.

### 3. Set `Secure` on auth-related cookies outside local development
**Decision:**
Apply `Secure` to `aipocalypse_session`, `aipocalypse_oauth_state`, and `admin_session` on non-localhost deployments. Local development on `http://localhost` remains allowed without `Secure` so the existing Bun dev flow continues to work.

**Rationale:**
This closes the biggest deployment-sensitive weakness while preserving developer ergonomics.

**Alternatives considered:**
- Always set `Secure`: breaks local HTTP development.
- Make `Secure` optional via a toggle only: too easy to misconfigure in production.

### 4. Add stateless synchronizer-style CSRF tokens for form POSTs
**Decision:**
Add signed CSRF tokens to all mutation forms:

- `POST /vote/:pollId`
- `POST /account/delete`
- `POST /admin/login`
- `POST /admin/polls`
- `POST /admin/polls/:id`

Each rendered form gets a hidden token scoped to the route family and subject:
- user forms: token includes user ID, action scope, and expiry
- admin login form: anonymous token with action scope and expiry
- authenticated admin forms: token includes admin scope and expiry

Verification is stateless: parse payload, check scope, verify signature, verify age/expiry.

**Rationale:**
The app already renders HTML server-side, so embedding a hidden token is easy. A signed stateless token avoids adding a CSRF table or server-side session storage.

**Alternatives considered:**
- SameSite-only protection: already partially present, but weaker and browser-behavior dependent.
- Double-submit cookie: workable, but adds another cookie and still needs signing/verification logic.

### 5. Implement admin login throttling as in-memory best-effort rate limiting
**Decision:**
Track failed admin login attempts in an in-memory sliding window keyed by client IP (first `X-Forwarded-For` hop when present, otherwise the direct request source if available, else a fallback bucket). After 5 failed attempts in 15 minutes, reject additional attempts from that key with `429 Too Many Requests` until the window clears. Successful login resets the bucket.

**Rationale:**
This fits the current architecture and raises the cost of brute-force attacks without external infrastructure. Because the app is a single Bun process on one host, in-memory state is acceptable for v1.

**Alternatives considered:**
- Reverse-proxy-only rate limiting: useful, but keeping app-level protection makes the behavior explicit and testable.
- Persistent/database-backed rate limiting: unnecessary complexity for the current deployment model.

### 6. Re-check bans on vote submission, but not on export/delete
**Decision:**
Keep the login-time ban check and add a second check on `POST /vote/:pollId`. If the user hash is now banned, reject the vote, clear the user session cookie, and log the rejection. Do not block `/account/export` or `/account/delete` for banned users.

**Rationale:**
This closes the “ban after login” gap for the main abuse path while preserving account-management rights.

**Alternatives considered:**
- Check bans on every authenticated request: stronger but broader than necessary for this change.
- Block all authenticated actions when banned: conflicts with deletion/export expectations.

### 7. Expand security-event logging, but keep it pseudonymous
**Decision:**
Add structured logs for:
- failed admin login attempts
- admin login throttling events
- CSRF validation failures on mutation routes
- banned vote attempts rejected after login

Log only route/action metadata, timestamps, and hashed identifiers when a user identity is already known. Never log passwords, raw CSRF tokens, GitHub usernames, or OAuth secrets.

**Rationale:**
Security failures are useful only if operators can see them. The logging model should stay compatible with the project’s data-minimization goals.

### 8. Update privacy copy to describe stored data precisely
**Decision:**
Revise the privacy page and login-adjacent notice to say the app stores the minimum data needed for voting and account management: hashed identity, vote records, timestamps, session cookies, and limited security logs. Explicitly say the app does not store GitHub username, display name, avatar, email, or access token.

**Rationale:**
The current implementation is privacy-conscious, but “no data is saved” is not accurate. Precise disclosure is safer and more trustworthy.

## Risks / Trade-offs

- **[In-memory admin throttling resets on process restart]** → Accept for v1; document that reverse-proxy throttling remains recommended in production.
- **[Stateless CSRF tokens cannot be individually revoked]** → Keep token expiry short and scope tokens narrowly to route families.
- **[Shorter admin session lifetime may annoy operators]** → Use a moderate 12-hour lifetime instead of extremely short sessions.
- **[`Secure` cookie logic depends on correct proxy headers]** → Centralize scheme/host detection and test local-vs-production behavior.
- **[Privacy page mentions security logs, which may raise user questions]** → Prefer accurate disclosure over misleading minimization claims.

## Migration Plan

1. Add new environment variables and secret-loading support:
   - `SESSION_SECRET`
   - `ADMIN_SESSION_SECRET`
2. Update `.env.example`, deployment docs, and secret-file names for Podman/Quadlet deployments.
3. Replace user/admin token signing and verification logic with the new payload formats and expiry checks.
4. Add shared CSRF helpers and wire tokens into user/admin forms plus POST handlers.
5. Add in-memory admin login throttle and security-event logging.
6. Add vote-time ban re-check and session clearing on banned write attempts.
7. Update privacy copy and related UI text.
8. Run the Bun test suite and add focused tests for cookie flags, session expiry, CSRF validation, throttling, and log-worthy failures.

**Rollback:**
- Application-only rollback is possible by redeploying the previous code and keeping the new env vars unused.
- No database migration is required for this change, so rollback risk is low.

## Open Questions

- Should the user-facing response for a rejected banned vote be a plain `403` message or a redirect to a friendly error page?
- Do we want a small helper route for CSRF token generation/rotation later, or is render-time generation sufficient for all current forms?
- Should reverse-proxy rate limiting be documented as required or merely recommended alongside the in-app throttle?