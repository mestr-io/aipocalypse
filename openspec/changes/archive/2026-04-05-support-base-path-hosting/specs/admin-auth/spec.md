## ADDED Requirements

### Requirement: Admin auth flows generate base-path-aware URLs
Admin login, logout, protected-route redirects, and admin navigation SHALL use the configured application base path.

#### Scenario: Admin login and logout honor base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an admin uses login or logout flows
- **THEN** login form actions, logout links, successful login redirects, and logout redirects resolve under `/aipocalypse/admin`

#### Scenario: Admin guard redirect honors base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an unauthenticated request targets an admin route
- **THEN** the redirect target resolves to `/aipocalypse/admin/login`

### Requirement: OAuth callback generation honors base path
The GitHub OAuth callback URL SHALL include the configured application base path.

#### Scenario: OAuth callback uses base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and the app generates the GitHub OAuth callback URL
- **THEN** the callback URL resolves to `/aipocalypse/auth/callback`
