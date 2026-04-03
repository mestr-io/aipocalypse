## 1. Logger Utility

- [x] 1.1 Create `src/lib/logger.ts` with a `log.info(action, meta?)` function that writes JSON lines to stdout
- [x] 1.2 Add unit test for the logger (`src/lib/logger.test.ts`) verifying JSON output format, timestamp, and metadata spreading

## 2. Admin Route Logging

- [x] 2.1 Add `admin.login` log on successful admin login in `src/admin/routes.ts`
- [x] 2.2 Add `admin.logout` log on admin logout in `src/admin/routes.ts`
- [x] 2.3 Add `admin.poll.created` log with pollId and title after poll creation in `src/admin/routes.ts`
- [x] 2.4 Add `admin.poll.updated` log with pollId and title after poll update in `src/admin/routes.ts`

## 3. User Route Logging

- [x] 3.1 Add `user.vote.cast` log with pollId and userId after vote submission in `src/index.ts`
- [x] 3.2 Add `user.data.exported` log with userId on data export in `src/index.ts`
- [x] 3.3 Add `user.account.deleted` log with userId on account deletion in `src/index.ts`

## 4. Auth Route Logging

- [x] 4.1 Add `auth.login` log with userId on successful OAuth callback in `src/auth/routes.ts`
- [x] 4.2 Add `auth.login.banned` log with userId when a banned user is rejected in `src/auth/routes.ts`
- [x] 4.3 Add `auth.logout` log with userId on auth logout in `src/auth/routes.ts`

## 5. Verification

- [x] 5.1 Run all tests to confirm nothing is broken
