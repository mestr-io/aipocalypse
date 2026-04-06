## ADDED Requirements

### Requirement: Account deletion form includes CSRF token
The authenticated account page SHALL render a hidden CSRF token field in the account deletion form.

#### Scenario: Account page renders deletion token
- **WHEN** an authenticated user navigates to `/account`
- **THEN** the account deletion form contains a hidden CSRF token field

## MODIFIED Requirements

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
