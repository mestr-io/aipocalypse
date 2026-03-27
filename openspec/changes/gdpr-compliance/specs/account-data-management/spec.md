## ADDED Requirements

### Requirement: Account page route
The system SHALL serve an authenticated page at `GET /account` accessible only to logged-in users.

#### Scenario: Authenticated user accesses account page
- **WHEN** an authenticated user navigates to `/account`
- **THEN** the page renders with data export and account deletion options and returns a 200 status

#### Scenario: Unauthenticated user accesses account page
- **WHEN** an unauthenticated user navigates to `/account`
- **THEN** the user is redirected to `/auth/login`

### Requirement: Data export
The system SHALL allow authenticated users to download all their personal data as a JSON file.

#### Scenario: Successful data export
- **WHEN** an authenticated user requests `GET /account/export`
- **THEN** the system returns a JSON response with `Content-Disposition: attachment` containing their user profile and all votes with human-readable poll titles and question text

#### Scenario: Export JSON structure
- **WHEN** an authenticated user downloads their data
- **THEN** the JSON contains a `user` object (githubUser, name, avatarUrl, createdAt), a `votes` array (each with poll name, question text, votedAt), and an `exportedAt` timestamp

#### Scenario: Export omits internal identifiers
- **WHEN** an authenticated user downloads their data
- **THEN** the JSON does not contain internal UUIDs (`id`) or `githubId`

### Requirement: Account deletion with confirmation
The system SHALL allow authenticated users to permanently delete their account and all associated data via a two-step confirmation flow.

#### Scenario: Deletion confirmation page
- **WHEN** an authenticated user clicks "Delete my account" on the account page
- **THEN** the system displays a confirmation page explaining that deletion is permanent and all votes will be removed

#### Scenario: Confirmed deletion
- **WHEN** an authenticated user confirms account deletion via `POST /account/delete`
- **THEN** the system hard-deletes the user row and all their answers from the database, clears the session cookie, and redirects to `/`

#### Scenario: Deletion cascades to votes
- **WHEN** a user's account is deleted
- **THEN** all rows in the `answers` table referencing that user are also deleted (via ON DELETE CASCADE)

#### Scenario: Deleted user can re-register
- **WHEN** a user who previously deleted their account logs in via GitHub OAuth
- **THEN** the system creates a fresh user record with a new internal ID

### Requirement: Account link in navigation
The navigation bar SHALL include a link to `/account` for authenticated users.

#### Scenario: Account link visible when logged in
- **WHEN** an authenticated user views any page
- **THEN** the navigation bar includes a "Privacy & Data" or "Account" link pointing to `/account`
