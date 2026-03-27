## ADDED Requirements

### Requirement: Banned GitHub IDs table
The system SHALL maintain a `banned_github_ids` table with `githubId INTEGER PRIMARY KEY` and `bannedAt TEXT NOT NULL`, decoupled from the `users` table.

#### Scenario: Table structure
- **WHEN** the migration runs
- **THEN** the `banned_github_ids` table exists with columns `githubId` (INTEGER PRIMARY KEY) and `bannedAt` (TEXT NOT NULL)

### Requirement: Ban check at login time
The system SHALL check the `banned_github_ids` table during the OAuth callback, before upserting the user. Banned GitHub IDs SHALL be denied login.

#### Scenario: Banned user attempts login
- **WHEN** a user whose `githubId` is in `banned_github_ids` completes the GitHub OAuth flow
- **THEN** the system does not create or update a user record, does not set a session cookie, and returns an error page indicating the account is suspended

#### Scenario: Non-banned user logs in normally
- **WHEN** a user whose `githubId` is not in `banned_github_ids` completes the GitHub OAuth flow
- **THEN** the system proceeds with the normal upsert and session flow

### Requirement: Admin ban action writes to banned_github_ids
The admin panel SHALL ban users by inserting into `banned_github_ids` instead of setting `isBanned` on the user row.

#### Scenario: Admin bans a user
- **WHEN** an admin bans a user from the admin panel
- **THEN** the user's `githubId` is inserted into `banned_github_ids` with the current timestamp

#### Scenario: Admin unbans a user
- **WHEN** an admin unbans a user from the admin panel
- **THEN** the user's `githubId` is removed from `banned_github_ids`

### Requirement: Ban survives account deletion
Banning a user and the user subsequently deleting their account SHALL NOT remove the ban.

#### Scenario: Banned user deletes account and re-registers
- **WHEN** a banned user deletes their account (removing their `users` row) and then attempts to log in via GitHub OAuth
- **THEN** the login is denied because their `githubId` is still in `banned_github_ids`

### Requirement: Remove isBanned from users table
The `isBanned` column SHALL be removed from the `users` table. All ban logic SHALL use the `banned_github_ids` table.

#### Scenario: Users table has no isBanned column
- **WHEN** the GDPR migration has run
- **THEN** the `users` table does not contain an `isBanned` column

### Requirement: Remove query-time ban filtering
The session middleware SHALL no longer check `isBanned` on the user row. Ban enforcement happens only at login time.

#### Scenario: Previously banned user with active session
- **WHEN** a user is banned while they have an active session
- **THEN** their existing session continues to work until it expires or they log out (ban takes effect on next login attempt)
