## ADDED Requirements

### Requirement: Admin dashboard and poll CRUD links honor base path
Admin dashboard links, new-poll links, poll form actions, and CRUD redirects SHALL use the configured application base path.

#### Scenario: Admin dashboard links honor base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an authenticated admin views the dashboard
- **THEN** links to create a poll and edit existing polls resolve under `/aipocalypse/admin`

#### Scenario: Admin create and delete redirects honor base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an admin creates or deletes a poll
- **THEN** the resulting redirect target resolves under `/aipocalypse/admin`
