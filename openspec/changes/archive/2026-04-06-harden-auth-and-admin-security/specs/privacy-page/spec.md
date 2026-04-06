## MODIFIED Requirements

### Requirement: Privacy page displays data collection details
The privacy page SHALL explain in plain language what the application stores: a hashed GitHub-derived identity, poll votes, related timestamps, session cookies, and limited security logs needed to operate and defend the service. The page SHALL explicitly state that the application does NOT store the user's GitHub username, display name, avatar, email address, or GitHub access token.

#### Scenario: Plain-language storage summary
- **WHEN** a visitor views the privacy page
- **THEN** the page describes the stored hashed identity, votes, timestamps, session cookies, and limited security logs in human-readable text

#### Scenario: No inaccurate zero-storage claim
- **WHEN** a visitor views the privacy page
- **THEN** the page does not claim that the application stores no data

### Requirement: Privacy page displays cookie information
The privacy page SHALL list the cookies used by the application by name, with their purpose, approximate lifetime, and whether they are limited to auth or admin flows.

#### Scenario: Cookie listing
- **WHEN** a visitor views the privacy page
- **THEN** the page lists `aipocalypse_session` for logged-in user sessions and `aipocalypse_oauth_state` for OAuth CSRF protection
- **AND** the page identifies `admin_session` as an admin-interface cookie used only after successful admin authentication

### Requirement: Login transparency notice
The login area SHALL display a brief, non-blocking notice informing users that the application stores the minimum data needed to support voting and account management, with a link to `/privacy` for details.

#### Scenario: Notice near login button
- **WHEN** an unauthenticated user views a page with the login link
- **THEN** a brief note is visible stating that a hashed identity, votes, and session data are stored, with a link to `/privacy`
