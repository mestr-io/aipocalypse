## ADDED Requirements

### Requirement: User session token uses dedicated signing secret
The system SHALL sign and verify the `aipocalypse_session` cookie using `SESSION_SECRET`. The signed token SHALL encode the internal user ID and an expiration time. Expired or tampered tokens SHALL be rejected.

#### Scenario: Valid user session token authenticates request
- **WHEN** the server receives an `aipocalypse_session` cookie whose signature is valid and whose expiration time is in the future
- **THEN** the user is authenticated as the internal user ID encoded in the token

#### Scenario: Expired session token is rejected
- **WHEN** the server receives an `aipocalypse_session` cookie whose expiration time has passed
- **THEN** the token is treated as invalid
- **AND** the request is handled as unauthenticated

### Requirement: Auth cookies are secure outside localhost development
The `aipocalypse_session` and `aipocalypse_oauth_state` cookies SHALL be `HttpOnly` and SHALL include the `Secure` attribute on non-localhost deployments. Local development on `localhost` over plain HTTP MAY omit `Secure`.

#### Scenario: Local development cookie without Secure
- **WHEN** the application runs on `http://localhost` during local development
- **THEN** the auth cookies may be set without the `Secure` attribute

#### Scenario: Non-localhost cookies require Secure
- **WHEN** the application sets `aipocalypse_session` or `aipocalypse_oauth_state` on a non-localhost origin
- **THEN** the `Set-Cookie` header includes the `Secure` attribute
