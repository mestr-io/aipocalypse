## ADDED Requirements

### Requirement: Account flows generate base-path-aware URLs
Account page navigation, export links, deletion form actions, and auth redirects SHALL use the configured application base path.

#### Scenario: Account links honor base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an authenticated user views the account page
- **THEN** the navigation link to the account page, the export link, and the account deletion form action all resolve under `/aipocalypse`

#### Scenario: Account auth redirect honors base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an unauthenticated user requests the account page
- **THEN** the redirect target resolves to `/aipocalypse/auth/login`
