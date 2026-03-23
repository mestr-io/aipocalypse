## Why

The app currently runs on port 3000 with no admin authentication and no way to create polls. To make the app functional, the admin needs to be able to log in with the `ADMIN_PASSWORD` env var and create/manage polls through a dedicated admin panel. The port also needs to change to 5555 to avoid conflicts with other local services.

## What Changes

- Change the server listen port from 3000 to 5555
- Implement admin password authentication via `ADMIN_PASSWORD` env var with cookie-based sessions
- Build admin login page (`GET /admin/login`) and login handler (`POST /admin/login`)
- Add admin guard middleware that protects all `/admin/*` routes
- Build poll creation page (`GET /admin/polls/new`) with inline answer editing — a poll requires a title, question body, and at least 2 answer options
- Build poll creation handler (`POST /admin/polls`) that inserts poll + questions in a single transaction
- Build admin dashboard (`GET /admin`) listing all polls with status indicators
- Add database query functions for poll/question CRUD operations

## Capabilities

### New Capabilities
- `admin-auth`: Admin login/logout using `ADMIN_PASSWORD` env var, cookie-based session, guard middleware for `/admin/*` routes
- `admin-poll-crud`: Admin poll creation form with inline answer management (minimum 2 answers), poll listing dashboard, database queries for polls and questions

### Modified Capabilities
- `app-skeleton`: Server port changes from 3000 to 5555, admin route stubs replaced with real admin auth and routes

## Impact

- `src/index.ts` — port change, admin middleware and route registration
- `src/admin/` — new directory for admin auth, routes, and views
- `src/db/queries/` — new directory for poll and question query functions
- `src/views/` — new admin page templates (login, dashboard, poll form)
- `src/public/style.css` — may need minor additions for admin form styling
- `.env.example` — no changes needed (ADMIN_PASSWORD already listed)
