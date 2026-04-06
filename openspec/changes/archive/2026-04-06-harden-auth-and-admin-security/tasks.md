## 1. Configuration and shared security helpers

- [x] 1.1 Add `SESSION_SECRET` and `ADMIN_SESSION_SECRET` to config loading, `.env.example`, and deployment/secret documentation
- [x] 1.2 Refactor user session signing/verification to use `SESSION_SECRET`, explicit expiry, and constant-time signature comparison
- [x] 1.3 Refactor admin session signing/verification to use `ADMIN_SESSION_SECRET`, explicit expiry, and constant-time signature comparison
- [x] 1.4 Add shared helpers for detecting when auth cookies must include `Secure`
- [x] 1.5 Add shared CSRF token helpers for generating and verifying scoped, expiring form tokens

## 2. User auth and vote hardening

- [x] 2.1 Update user login/logout and session middleware to use the new session token format and cookie settings
- [x] 2.2 Update OAuth state cookie handling to apply the hardened cookie policy
- [x] 2.3 Render CSRF tokens in authenticated vote forms on the poll detail page
- [x] 2.4 Validate CSRF tokens in `POST /vote/:pollId` before processing votes
- [x] 2.5 Re-check `banned_hashed_ids` during vote submission, clear the session on banned users, and reject the write

## 3. Admin auth hardening

- [x] 3.1 Add CSRF tokens to the admin login form and validate them in `POST /admin/login`
- [x] 3.2 Implement in-memory admin login throttling keyed by client identity with reset on successful login
- [x] 3.3 Update admin session cookie issuance and verification for expiry and hardened cookie attributes
- [x] 3.4 Add CSRF tokens to admin poll create/edit forms and validate them on admin mutation routes
- [x] 3.5 Ensure admin guard rejects expired sessions and redirects to the base-path-aware login route

## 4. Security event logging

- [x] 4.1 Log failed admin login attempts with machine-readable reasons and without logging passwords
- [x] 4.2 Log CSRF validation failures on user and admin mutation routes
- [x] 4.3 Log vote submissions rejected because the user became banned after login

## 5. Privacy copy and user account flows

- [x] 5.1 Update the privacy page text to accurately describe stored hashes, votes, timestamps, cookies, and limited security logs
- [x] 5.2 Update the login-area transparency notice to replace any zero-storage implication with accurate minimal-storage language
- [x] 5.3 Render a CSRF token in the account deletion form and validate it in `POST /account/delete`

## 6. Verification

- [x] 6.1 Add or update Bun tests for user session expiry, admin session expiry, and secure-cookie behavior
- [x] 6.2 Add or update tests for CSRF validation on vote, account delete, admin login, and admin poll mutation routes
- [x] 6.3 Add or update tests for admin login throttling and security-event logging
- [x] 6.4 Run `bun test` and fix any regressions
