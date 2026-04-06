## 1. Spec sync updates

- [x] 1.1 Update `account-data-management` to match the current hashed-identity-only export format
- [x] 1.2 Update `admin-auth` to match CSRF, login throttling, expiring admin sessions, and `ADMIN_SESSION_SECRET`
- [x] 1.3 Update `hash-identity-system` to match `SESSION_SECRET`-backed user sessions and current auth-cookie behavior
- [x] 1.4 Update `privacy-page` to match the current plain-language privacy notice and login transparency copy
- [x] 1.5 Update `public-poll-views` to match CSRF, ban re-checks, and in-memory vote cooldown behavior
- [x] 1.6 Update `activity-logging` wording to reflect in-memory cooldown rejection logging

## 2. Verification

- [x] 2.1 Review the updated delta specs for archive/sync safety, including exact MODIFIED requirement headers
- [x] 2.2 Run OpenSpec validation/status checks as needed to confirm the change is ready for apply/archive workflows
- [x] 2.3 Identify any remaining non-spec docs drift as explicit follow-up work rather than folding it into this change
