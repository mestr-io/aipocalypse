## ADDED Requirements

### Requirement: Admin poll edit flows honor base path
Admin poll edit links, form actions, and edit/publish/hide redirects SHALL use the configured application base path.

#### Scenario: Admin edit form honors base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an authenticated admin opens or submits the edit form
- **THEN** edit links and form actions resolve under `/aipocalypse/admin/polls`

#### Scenario: Admin status-change redirects honor base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an admin publishes or hides a poll
- **THEN** the resulting redirect target resolves under `/aipocalypse/admin`
