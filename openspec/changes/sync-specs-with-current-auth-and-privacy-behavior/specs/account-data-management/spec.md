## MODIFIED Requirements

### Requirement: Data export
The system SHALL allow authenticated users to download all personal data currently stored for their account as a JSON file.

#### Scenario: Successful data export
- **WHEN** an authenticated user requests `GET /account/export`
- **THEN** the system returns a JSON response with `Content-Disposition: attachment`

#### Scenario: Export JSON structure
- **WHEN** an authenticated user downloads their data
- **THEN** the JSON contains a `user` object with `hashedId` and `createdAt`, a `votes` array, and an `exportedAt` timestamp
- **AND** the export does NOT contain GitHub username, display name, or avatar fields
