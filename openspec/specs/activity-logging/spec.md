## Purpose

Define structured application activity logging for significant auth, admin, data-export, account-deletion, and vote events without logging page visits or direct PII.
## Requirements
### Requirement: Logger utility outputs structured JSON lines
The system SHALL provide a logger utility at `src/lib/logger.ts` that writes structured JSON lines to stdout. Each log entry MUST contain a `ts` field (ISO 8601 timestamp), a `level` field (string), and an `action` field (dot-separated namespace string). Additional metadata fields SHALL be spread into the top-level JSON object. The logger MUST NOT add any external dependencies.

#### Scenario: Info log produces valid JSON line
- **WHEN** `log.info("admin.poll.created", { pollId: "abc123" })` is called
- **THEN** stdout receives a single line of valid JSON containing `{"ts":"<ISO timestamp>","level":"info","action":"admin.poll.created","pollId":"abc123"}`

#### Scenario: Log with no metadata
- **WHEN** `log.info("auth.logout")` is called with no metadata argument
- **THEN** stdout receives a JSON line containing only `ts`, `level`, and `action` fields

### Requirement: Admin login and logout are logged
The system SHALL log an info-level entry when an admin successfully authenticates via the admin login form, and when an admin logs out.

#### Scenario: Admin login
- **WHEN** an admin submits a correct password to `POST /admin/login`
- **THEN** a log entry is written with action `admin.login`

#### Scenario: Admin logout
- **WHEN** an admin visits the logout route
- **THEN** a log entry is written with action `admin.logout`

### Requirement: Admin poll mutations are logged
The system SHALL log an info-level entry when an admin creates or updates a poll. The log entry MUST include the poll ID and poll title.

#### Scenario: Poll created
- **WHEN** an admin creates a new poll via `POST /admin/polls`
- **THEN** a log entry is written with action `admin.poll.created` including `pollId` and `title`

#### Scenario: Poll updated
- **WHEN** an admin updates an existing poll via `POST /admin/polls/:id`
- **THEN** a log entry is written with action `admin.poll.updated` including `pollId` and `title`

### Requirement: User vote is logged
The system SHALL log an info-level entry when a user casts or changes a vote. The log entry MUST include the poll ID. The log entry MUST NOT include the user's GitHub username or any PII — only the hashed user ID.

#### Scenario: Vote cast
- **WHEN** an authenticated user submits a vote via `POST /vote/:pollId`
- **THEN** a log entry is written with action `user.vote.cast` including `pollId` and `userId` (hashed ID, not GitHub username)

### Requirement: User data export is logged
The system SHALL log an info-level entry when a user exports their data. The log entry MUST include only the hashed user ID.

#### Scenario: Data exported
- **WHEN** an authenticated user requests `GET /account/export`
- **THEN** a log entry is written with action `user.data.exported` including `userId`

### Requirement: User account deletion is logged
The system SHALL log an info-level entry when a user deletes their account. The log entry MUST include the hashed user ID.

#### Scenario: Account deleted
- **WHEN** an authenticated user submits `POST /account/delete`
- **THEN** a log entry is written with action `user.account.deleted` including `userId`

### Requirement: Auth login via GitHub OAuth is logged
The system SHALL log an info-level entry when a user completes GitHub OAuth authentication (user upsert). The log entry MUST include the hashed user ID. If the user is banned, a separate log entry MUST be written instead.

#### Scenario: Successful OAuth login
- **WHEN** a user completes the GitHub OAuth callback and is not banned
- **THEN** a log entry is written with action `auth.login` including `userId`

#### Scenario: Banned user rejected
- **WHEN** a user completes the GitHub OAuth callback but is marked as banned
- **THEN** a log entry is written with action `auth.login.banned` including `userId`

### Requirement: Auth logout is logged
The system SHALL log an info-level entry when a user logs out via the auth logout route.

#### Scenario: User logout
- **WHEN** a user visits `GET /auth/logout`
- **THEN** a log entry is written with action `auth.logout` including `userId`

### Requirement: No page visit logging
The system SHALL NOT log page visits, navigation, or GET requests that do not represent a user-initiated mutation or significant action. Only discrete actions that mutate state or represent significant operations (data export, auth events) SHALL be logged.

#### Scenario: Page visit not logged
- **WHEN** a user navigates to any page (e.g., `GET /`, `GET /polls/:id`, `GET /admin`)
- **THEN** no log entry is written

### Requirement: Vote cooldown rejections are logged
The system SHALL log vote requests rejected by the in-memory vote cooldown policy as structured JSON lines. The log entry SHALL use action `user.vote.rejected.cooldown` and include the poll ID and the user's hashed ID.

#### Scenario: Cooldown rejection is logged
- **WHEN** an authenticated user's vote request is rejected because fewer than 5 seconds have elapsed since their last accepted vote write on that poll
- **THEN** a log entry is written with action `user.vote.rejected.cooldown`
- **AND** the metadata includes `pollId` and `userId`

