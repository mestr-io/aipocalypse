## ADDED Requirements

### Requirement: Vote form includes CSRF token
The poll detail page SHALL render a hidden CSRF token field inside the vote form for authenticated users.

#### Scenario: Authenticated poll detail includes vote token
- **WHEN** an authenticated user views `GET /poll/:id` for an active poll
- **THEN** the vote form contains a hidden CSRF token field

#### Scenario: Logged-out poll detail shows no vote token
- **WHEN** a logged-out user views `GET /poll/:id`
- **THEN** no vote form CSRF token is rendered because no vote form is available

### Requirement: Vote submission validates CSRF token and ban status
The application SHALL accept `POST /vote/:pollId` only when the authenticated user session is valid, the submitted CSRF token is valid, the poll is active, the selected question belongs to the poll, and the user's hashed identity is not currently banned.

#### Scenario: Valid vote submission succeeds
- **WHEN** an authenticated, non-banned user submits `POST /vote/:pollId` with a valid CSRF token and a valid option for an active poll
- **THEN** the application records or updates the vote
- **AND** redirects back to the poll detail page

#### Scenario: Missing or invalid CSRF token rejects vote
- **WHEN** an authenticated user submits `POST /vote/:pollId` without a CSRF token or with an invalid token
- **THEN** the application responds with `403 Forbidden`
- **AND** no vote is created or changed

#### Scenario: User banned after login cannot keep voting
- **WHEN** an authenticated user whose hashed identity has since been added to `banned_hashed_ids` submits `POST /vote/:pollId`
- **THEN** the application responds with `403 Forbidden`
- **AND** no vote is created or changed
- **AND** the user session cookie is cleared
