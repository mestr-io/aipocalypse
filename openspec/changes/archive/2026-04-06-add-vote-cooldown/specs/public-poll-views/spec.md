## MODIFIED Requirements

### Requirement: Vote submission validates CSRF token and ban status
The application SHALL accept `POST /vote/:pollId` only when the authenticated user session is valid, the submitted CSRF token is valid, the poll is active, the selected question belongs to the poll, the user's hashed identity is not currently banned, and at least 5 seconds have elapsed since that user's previous vote write on the same poll. The first vote on a poll SHALL be allowed immediately. If the cooldown window has not elapsed, the application SHALL reject the request with `429 Too Many Requests` and SHALL NOT create or change the stored vote.

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

#### Scenario: First vote is not delayed by cooldown
- **WHEN** an authenticated user who has not yet voted on a poll submits a valid vote
- **THEN** the application accepts the vote immediately

#### Scenario: Rapid repeat vote change is throttled
- **WHEN** an authenticated user submits another valid vote request for the same poll less than 5 seconds after their previous vote write
- **THEN** the application responds with `429 Too Many Requests`
- **AND** the existing stored vote is unchanged
