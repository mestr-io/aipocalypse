## ADDED Requirements

### Requirement: Banned GitHub IDs table
The system SHALL maintain a `banned_github_ids` table with `githubId INTEGER PRIMARY KEY` and `bannedAt TEXT NOT NULL`.

#### Scenario: Table structure
- **WHEN** the migration runs
- **THEN** the `banned_github_ids` table exists with the correct columns

### Requirement: Ban check at login time
The system SHALL check `banned_github_ids` during OAuth callback before upserting the user.

#### Scenario: Banned user attempts login
- **WHEN** a user whose `githubId` is in `banned_github_ids` completes GitHub OAuth
- **THEN** the system does not create/update a user record and returns an error page

#### Scenario: Non-banned user logs in normally
- **WHEN** a user whose `githubId` is not in `banned_github_ids` completes GitHub OAuth
- **THEN** the system proceeds with the normal upsert and session flow

### Requirement: Admin ban action writes to banned_github_ids
The admin panel SHALL ban users by inserting into `banned_github_ids`.

#### Scenario: Admin bans a user
- **WHEN** an admin bans a user
- **THEN** the user's `githubId` is inserted into `banned_github_ids`

#### Scenario: Admin unbans a user
- **WHEN** an admin unbans a user
- **THEN** the user's `githubId` is removed from `banned_github_ids`

### Requirement: Ban survives account deletion
Banning a user and the user subsequently deleting their account SHALL NOT remove the ban.

#### Scenario: Banned user deletes account and re-registers
- **WHEN** a banned user deletes their account and then attempts to log in
- **THEN** the login is denied because their `githubId` is still in `banned_github_ids`

### Requirement: Remove isBanned from users table
The `isBanned` column SHALL be removed from the `users` table.

#### Scenario: Users table has no isBanned column
- **WHEN** the GDPR migration has run
- **THEN** the `users` table does not contain an `isBanned` column
