## 1. Port Change

- [x] 1.1 Change server port from 3000 to 5555 in `src/index.ts`
- [x] 1.2 Verify `bun run dev` starts on port 5555

## 2. Admin Authentication

- [x] 2.1 Create `src/admin/auth.ts` — HMAC token signing/verification helpers using `ADMIN_PASSWORD` as key
- [x] 2.2 Create `src/admin/middleware.ts` — admin guard middleware that checks `admin_session` cookie and redirects to `/admin/login` if invalid
- [x] 2.3 Create `src/views/admin/login.ts` — admin login page template with password form and error message slot
- [x] 2.4 Add `GET /admin/login` route that renders the login form
- [x] 2.5 Add `POST /admin/login` route that verifies password, sets signed cookie, and redirects to `/admin`
- [x] 2.6 Add `GET /admin/logout` route that clears the cookie and redirects to `/admin/login`
- [x] 2.7 Mount admin guard middleware on `/admin/*` (excluding `/admin/login`)

## 3. Database Query Functions

- [x] 3.1 Create `src/db/queries/polls.ts` — `createPoll(data, answers)` function that inserts poll + questions in a transaction
- [x] 3.2 Add `listPolls()` function returning all non-deleted polls ordered by `createdAt` desc with question count

## 4. Admin Dashboard

- [x] 4.1 Create `src/views/admin/dashboard.ts` — admin dashboard template listing polls with title, status badge, question count, and creation date
- [x] 4.2 Replace the admin route stub in `src/index.ts` with a `GET /admin` handler that queries polls and renders the dashboard

## 5. Poll Creation

- [x] 5.1 Create `src/views/admin/poll-form.ts` — poll creation form template with title, body, due date, status select, and dynamic answer option rows (min 2)
- [x] 5.2 Add inline `<script>` for add/remove answer row interactions with minimum-2 enforcement
- [x] 5.3 Add `GET /admin/polls/new` route that renders the empty poll form
- [x] 5.4 Add `POST /admin/polls` route that validates input (title required, min 2 non-empty answers), calls `createPoll()`, and redirects to `/admin`
- [x] 5.5 Handle validation errors by re-rendering the form with error message and preserving submitted values

## 6. Integration and Wiring

- [x] 6.1 Wire all admin routes into `src/index.ts` — mount middleware, login, logout, dashboard, poll creation routes
- [x] 6.2 Update `src/public/style.css` if any admin-specific styles are needed (form layout, error messages)

## 7. Tests

- [x] 7.1 Create `src/admin/auth.test.ts` — test HMAC sign/verify helpers
- [x] 7.2 Create `src/db/queries/polls.test.ts` — test `createPoll()` and `listPolls()` with a temp database
- [x] 7.3 Verify `bun test` passes with all new and existing tests
