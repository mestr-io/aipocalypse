## MODIFIED Requirements

### Requirement: Three-color identity rendering
The system SHALL provide a view helper that takes an 18-char hashed ID and renders it as a visual identity with green text and colored glyphs. The hash SHALL be split into three 6-character segments. The rendered output SHALL contain the hash text with each segment displayed in the standard green link color (`#009900`) as inline CSS, separated by hyphens, followed by three colored square glyphs (U+25A0, `■`) where each glyph uses the segment's hex value as its inline CSS `color`.

#### Scenario: Hash renders as green text segments with colored square glyphs
- **WHEN** the identity renderer is called with hash `a7f3b2c1e9d04f8baa`
- **THEN** the output contains three text `<span>` elements each with inline style `color:#009900`, displaying text `a7f3b2`, `c1e9d0`, and `4f8baa` respectively, separated by hyphens
- **AND** the output contains three glyph `<span>` elements with inline styles `color:#a7f3b2`, `color:#c1e9d0`, and `color:#4f8baa` displaying the `■` character

#### Scenario: Identity links to account page
- **WHEN** the identity is rendered in the page header for a logged-in user
- **THEN** the hash text is wrapped in an `<a>` element linking to `/account`

### Requirement: Account page shows hash identity
The account page SHALL display the user's hashed ID rendered as the visual identity (green text segments plus colored square glyphs). The page SHALL provide export data, delete account, and logout functionality with clear visual separation between sections. The logout link SHALL be visually separated from the delete-account section by a top border or spacing. The page SHALL NOT display any GitHub profile information.

#### Scenario: Account page renders for logged-in user
- **WHEN** a logged-in user visits `/account`
- **THEN** the page shows their hash identity with green text segments and colored glyphs, an export data link, a delete account button, and a logout link
- **AND** the logout link has visible separation from the delete-account section above it

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
