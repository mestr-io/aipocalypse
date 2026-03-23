## MODIFIED Requirements

### Requirement: Hono app entry point
The application SHALL have an entry point at `src/index.ts` that creates a Hono app, registers all route groups, and starts the HTTP server on port 5555.

#### Scenario: Server starts successfully
- **WHEN** `bun run dev` is executed
- **THEN** the Hono server starts and listens on `http://localhost:5555`

#### Scenario: Server logs startup
- **WHEN** the server starts
- **THEN** a message is printed to stdout indicating the server is running and on which port

### Requirement: Route group stubs
The application SHALL define route stubs for all 5 route groups. Each stub SHALL return a valid HTML page using the shared layout. The admin route group SHALL be replaced with real admin auth and CRUD routes.

#### Scenario: Home page responds
- **WHEN** a browser requests `GET /`
- **THEN** the server responds with a 200 status and an HTML page showing a placeholder "AIPocalypse" heading

#### Scenario: Poll page responds
- **WHEN** a browser requests `GET /poll/:id`
- **THEN** the server responds with a 200 status and an HTML page showing a placeholder poll detail

#### Scenario: Auth routes respond
- **WHEN** a browser requests `GET /auth/login`
- **THEN** the server responds with a placeholder message (not yet implemented)

#### Scenario: Vote routes are guarded
- **WHEN** an unauthenticated browser requests `POST /vote/:pollId`
- **THEN** the server responds with a 401 status (auth not yet implemented, but route exists)

#### Scenario: Admin routes redirect to login
- **WHEN** an unauthenticated browser requests `GET /admin`
- **THEN** the server redirects to `GET /admin/login`
