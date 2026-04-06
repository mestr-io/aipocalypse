## Purpose

Define account page access, user data export, account deletion, and account-related navigation behavior.
## Requirements
### Requirement: Account page route
The system SHALL serve an authenticated page at `GET /account` accessible only to logged-in users.

#### Scenario: Authenticated user accesses account page
- **WHEN** an authenticated user navigates to `/account`
- **THEN** the page renders with data export and account deletion options

#### Scenario: Unauthenticated user accesses account page
- **WHEN** an unauthenticated user navigates to `/account`
- **THEN** the user is redirected to `/auth/login`

### Requirement: Data export
The system SHALL allow authenticated users to download all their personal data as a JSON file.

#### Scenario: Successful data export
- **WHEN** an authenticated user requests `GET /account/export`
- **THEN** the system returns a JSON response with `Content-Disposition: attachment`

#### Scenario: Export JSON structure
- **WHEN** an authenticated user downloads their data
- **THEN** the JSON contains a `user` object (githubUser, name, avatarUrl, createdAt), a `votes` array, and an `exportedAt` timestamp

### Requirement: Account deletion with confirmation
The system SHALL allow authenticated users to permanently delete their account only when `POST /account/delete` includes a valid CSRF token generated for that user from the account page.

#### Scenario: Confirmed deletion
- **WHEN** an authenticated user submits `POST /account/delete` with a valid CSRF token
- **THEN** the system hard-deletes the user row and all their answers, clears the session cookie, and redirects to `/`

#### Scenario: Deletion cascades to votes
- **WHEN** a user's account is deleted
- **THEN** all rows in the `answers` table referencing that user are also deleted

#### Scenario: Missing or invalid token rejects deletion
- **WHEN** an authenticated user submits `POST /account/delete` without a CSRF token or with an invalid token
- **THEN** the system responds with `403 Forbidden`
- **AND** the user account is not deleted

### Requirement: Account link in navigation
The navigation bar SHALL include a link to `/account` for authenticated users.

#### Scenario: Account link visible when logged in
- **WHEN** an authenticated user views any page
- **THEN** the navigation bar includes an "Account" link pointing to `/account`

### Requirement: Account flows generate base-path-aware URLs
Account page navigation, export links, deletion form actions, and auth redirects SHALL use the configured application base path.

#### Scenario: Account links honor base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an authenticated user views the account page
- **THEN** the navigation link to the account page, the export link, and the account deletion form action all resolve under `/aipocalypse`

#### Scenario: Account auth redirect honors base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an unauthenticated user requests the account page
- **THEN** the redirect target resolves to `/aipocalypse/auth/login`

### Requirement: Account deletion form includes CSRF token
The authenticated account page SHALL render a hidden CSRF token field in the account deletion form.

#### Scenario: Account page renders deletion token
- **WHEN** an authenticated user navigates to `/account`
- **THEN** the account deletion form contains a hidden CSRF token field

