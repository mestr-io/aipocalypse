## Purpose

Define hashed GitHub identity derivation, pseudonymous user rendering, ban checks, privacy-preserving OAuth handling, and related account/export behavior.

## Requirements

### Requirement: Hash derivation function
The system SHALL provide a function that computes a user's hashed identity from their GitHub numeric ID. The function SHALL use HMAC-SHA256 with the `HASH_PEPPER` environment variable as the key and the GitHub ID (as a string) as the message. The output SHALL be the first 18 hexadecimal characters (72 bits) of the hex-encoded digest, lowercase.

#### Scenario: Compute hash for a GitHub ID
- **WHEN** the hash function is called with GitHub ID `58320172` and pepper `mysecretpepper`
- **THEN** it returns exactly 18 lowercase hex characters derived from `HMAC-SHA256("mysecretpepper", "58320172")`

#### Scenario: Same input produces same output
- **WHEN** the hash function is called twice with the same GitHub ID and the same pepper
- **THEN** both calls return identical results

#### Scenario: Different IDs produce different hashes
- **WHEN** the hash function is called with GitHub IDs `1` and `2` using the same pepper
- **THEN** the returned hashes are different

### Requirement: HASH_PEPPER environment variable
The system SHALL require a `HASH_PEPPER` environment variable to be set. The pepper SHALL be used as the HMAC key for all hash computations. If `HASH_PEPPER` is not set, the application SHALL throw an error at startup with a clear message.

#### Scenario: Application starts with HASH_PEPPER set
- **WHEN** the application starts and `HASH_PEPPER` is defined in the environment
- **THEN** the hash derivation function is available and operational

#### Scenario: Application fails without HASH_PEPPER
- **WHEN** the application starts and `HASH_PEPPER` is not set
- **THEN** the application throws an error with a message indicating that `HASH_PEPPER` is required

### Requirement: Three-color identity rendering
The system SHALL provide a view helper that takes an 18-char hashed ID and renders it as a visual identity with green text and colored glyphs. The hash SHALL be split into three 6-character segments. The rendered output SHALL contain the hash text with each segment displayed in the standard green link color (`#009900`) as inline CSS, separated by hyphens, followed by three colored square glyphs (U+25A0, `■`) where each glyph uses the segment's hex value as its inline CSS `color`.

#### Scenario: Hash renders as green text segments with colored square glyphs
- **WHEN** the identity renderer is called with hash `a7f3b2c1e9d04f8baa`
- **THEN** the output contains three text `<span>` elements each with inline style `color:#009900`, displaying text `a7f3b2`, `c1e9d0`, and `4f8baa` respectively, separated by hyphens
- **AND** the output contains three glyph `<span>` elements with inline styles `color:#a7f3b2`, `color:#c1e9d0`, and `color:#4f8baa` displaying the `■` character

#### Scenario: Identity links to account page
- **WHEN** the identity is rendered in the page header for a logged-in user
- **THEN** the hash text is wrapped in an `<a>` element linking to `/account`

### Requirement: OAuth callback discards profile data
The OAuth callback handler SHALL compute the hashed ID from the GitHub profile's numeric ID immediately after receiving the profile response. The handler SHALL pass only the hashed ID to the user upsert function. The GitHub username, display name, and avatar URL SHALL NOT be stored or passed beyond the callback handler.

#### Scenario: Login with new GitHub account
- **WHEN** a user authenticates via GitHub OAuth for the first time
- **THEN** a new user row is created with only `id` (UUIDv7), `hashedId` (18-char hex), `createdAt`, and `updatedAt`
- **AND** no GitHub username, display name, or avatar URL is stored in the database

#### Scenario: Login with existing GitHub account
- **WHEN** a user authenticates via GitHub OAuth and a user with the same hashed ID already exists
- **THEN** the existing user's `updatedAt` is updated and their internal `id` is returned
- **AND** no profile data is stored or updated

### Requirement: Ban check uses hashed ID
The ban check during OAuth callback SHALL compute the hashed ID from the GitHub profile's numeric ID and check it against the `banned_hashed_ids` table. Banned users SHALL be rejected before the user upsert occurs.

#### Scenario: Banned user attempts login
- **WHEN** a user with a banned hashed ID attempts to authenticate via GitHub OAuth
- **THEN** the system returns a 403 response with a ban message
- **AND** no user row is created or updated

#### Scenario: Non-banned user logs in normally
- **WHEN** a user with a non-banned hashed ID authenticates via GitHub OAuth
- **THEN** the login proceeds normally

### Requirement: Account page shows hash identity
The account page SHALL display the user's hashed ID rendered as the visual identity (green text segments plus colored square glyphs). The page SHALL provide export data, delete account, and logout functionality with clear visual separation between sections. The logout link SHALL be visually separated from the delete-account section by a top border or spacing. The page SHALL NOT display any GitHub profile information.

#### Scenario: Account page renders for logged-in user
- **WHEN** a logged-in user visits `/account`
- **THEN** the page shows their hash identity with green text segments and colored glyphs, an export data link, a delete account button, and a logout link
- **AND** the logout link has visible separation from the delete-account section above it

### Requirement: Data export contains only hash and votes
The data export function SHALL return a JSON object containing the user's `hashedId`, `createdAt`, and their vote history (poll name, question text, vote timestamp). The export SHALL NOT contain any GitHub profile information.

#### Scenario: User exports their data
- **WHEN** a logged-in user requests a data export
- **THEN** the downloaded JSON contains `hashedId`, `createdAt`, vote history, and `exportedAt` timestamp
- **AND** no GitHub username, display name, or avatar URL is present in the export

### Requirement: Admin ban management uses hashed IDs
The admin panel SHALL ban and unban users by their hashed ID. The admin views SHALL display user hashes instead of GitHub usernames.

#### Scenario: Admin bans a user by hashed ID
- **WHEN** an admin submits a ban action for a hashed ID
- **THEN** the hashed ID is inserted into the `banned_hashed_ids` table

#### Scenario: Admin unbans a user by hashed ID
- **WHEN** an admin submits an unban action for a hashed ID
- **THEN** the hashed ID is removed from the `banned_hashed_ids` table

### Requirement: Privacy page minimal notice
The privacy page SHALL display a concise, human-readable notice explaining what data is stored: a one-way hash of the user's GitHub numeric ID, a session cookie, and their poll votes. The page SHALL NOT display raw SQL DDL, `CREATE TABLE` statements, or internal column names. The page SHALL state that GitHub username, avatar, and access token are not stored. The page SHALL list GDPR rights (access, export, erasure) with a link to the account page. The page SHALL link to the source code repository.

#### Scenario: Privacy page shows minimal notice
- **WHEN** a user visits `/privacy`
- **THEN** the page contains text explaining that a hashed ID is stored
- **AND** the page does NOT contain `CREATE TABLE` or SQL DDL
- **AND** the page contains a link to the account page for GDPR rights
- **AND** the page contains a link to the source code repository

#### Scenario: Privacy page accessible to logged-out users
- **WHEN** a logged-out user visits `/privacy`
- **THEN** the page renders successfully with the privacy notice
