## ADDED Requirements

### Requirement: Privacy page route
The system SHALL serve a public page at `GET /privacy` accessible to all visitors (authenticated or not).

#### Scenario: Unauthenticated visitor accesses privacy page
- **WHEN** an unauthenticated user navigates to `/privacy`
- **THEN** the page renders with full privacy policy content and a 200 status

#### Scenario: Authenticated user accesses privacy page
- **WHEN** an authenticated user navigates to `/privacy`
- **THEN** the page renders with full privacy policy content, the nav shows their logged-in state, and returns a 200 status

### Requirement: Privacy page displays data collection details
The privacy page SHALL explain what personal data is collected, showing the actual database schema for the `users` table as a SQL code block.

#### Scenario: Schema display
- **WHEN** a visitor views the privacy page
- **THEN** the page displays the `CREATE TABLE users` DDL showing exactly which columns are stored

#### Scenario: Data source explanation
- **WHEN** a visitor views the privacy page
- **THEN** the page explains that data is sourced from GitHub OAuth with no email, no tracking, and no analytics

### Requirement: Privacy page displays cookie information
The privacy page SHALL list all cookies used by the application by name, with their purpose and lifetime.

#### Scenario: Cookie listing
- **WHEN** a visitor views the privacy page
- **THEN** the page lists `aipocalypse_session` (30-day session cookie, httpOnly) and `aipocalypse_oauth_state` (10-minute CSRF protection, httpOnly)

#### Scenario: No tracking cookies disclosure
- **WHEN** a visitor views the privacy page
- **THEN** the page explicitly states there are no analytics, tracking, or third-party cookies

### Requirement: Privacy page displays legal basis
The privacy page SHALL state the legal basis for data processing as contract performance under Art. 6(1)(b) GDPR.

#### Scenario: Legal basis statement
- **WHEN** a visitor views the privacy page
- **THEN** the page states that data is processed under Art. 6(1)(b) GDPR — necessary to provide the service the user signed up for

### Requirement: Privacy page displays user rights
The privacy page SHALL inform users of their rights under GDPR: access, export, erasure, and the ability to lodge a complaint with a supervisory authority.

#### Scenario: Rights listing
- **WHEN** a visitor views the privacy page
- **THEN** the page lists the right to access data, export data, and delete the account, with links to the `/account` page for authenticated users

### Requirement: Privacy page links to source code
The privacy page SHALL include a link to the project's GitHub repository so users can verify claims independently.

#### Scenario: Repository link
- **WHEN** a visitor views the privacy page
- **THEN** the page contains a link to the GitHub repository

### Requirement: Footer privacy link
Every page SHALL include a link to `/privacy` in the footer.

#### Scenario: Footer link present on homepage
- **WHEN** a visitor views the homepage
- **THEN** the footer contains a "Privacy" link pointing to `/privacy`

#### Scenario: Footer link present on poll page
- **WHEN** a visitor views a poll detail page
- **THEN** the footer contains a "Privacy" link pointing to `/privacy`

### Requirement: Login transparency notice
The login area SHALL display a brief, non-blocking notice informing users about data storage, with a link to the privacy page.

#### Scenario: Notice near login button
- **WHEN** an unauthenticated user views a page with the login link
- **THEN** a brief note is visible stating what data is stored, with a link to `/privacy`
