## ADDED Requirements

### Requirement: Failed admin login attempts are logged
The system SHALL log failed admin login attempts as structured JSON lines without recording the submitted password. The log entry SHALL use action `admin.login.failed` and include a machine-readable reason.

#### Scenario: Incorrect password is logged
- **WHEN** an admin login attempt fails because the submitted password is incorrect
- **THEN** a log entry is written with action `admin.login.failed`
- **AND** the metadata includes reason `invalid-password`
- **AND** the submitted password is not logged

#### Scenario: Throttled login attempt is logged
- **WHEN** an admin login attempt is rejected because the client is rate limited
- **THEN** a log entry is written with action `admin.login.failed`
- **AND** the metadata includes reason `rate-limited`

### Requirement: CSRF rejections are logged
The system SHALL log CSRF validation failures on state-changing routes as structured JSON lines. The log entry SHALL use action `security.csrf.rejected` and include the target route and scope, plus the hashed user ID when an authenticated user identity is already known.

#### Scenario: Authenticated vote CSRF failure is logged
- **WHEN** an authenticated user's vote submission is rejected because the CSRF token is missing or invalid
- **THEN** a log entry is written with action `security.csrf.rejected`
- **AND** the metadata includes the vote route and the user's hashed ID

#### Scenario: Anonymous admin login CSRF failure is logged
- **WHEN** `POST /admin/login` is rejected because the CSRF token is missing or invalid
- **THEN** a log entry is written with action `security.csrf.rejected`
- **AND** the metadata includes the route and the `admin-login` scope

### Requirement: Rejected banned vote attempts are logged
The system SHALL log vote attempts rejected because the user became banned after login. The log entry SHALL use action `user.vote.rejected.banned` and include the poll ID and the user's hashed ID.

#### Scenario: Banned write attempt is logged
- **WHEN** an authenticated user's vote submission is rejected because their hashed identity is now banned
- **THEN** a log entry is written with action `user.vote.rejected.banned`
- **AND** the metadata includes `pollId` and `userId`
