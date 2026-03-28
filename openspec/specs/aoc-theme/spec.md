## Requirements

### Requirement: Advent of Code visual theme
The CSS SHALL implement a visual style inspired by Advent of Code with the following properties:
- Background color: `#0f0f23` (dark navy)
- Primary text color: `#cccccc` (light grey)
- Accent color: `#00cc00` (terminal green)
- Highlight color: `#ffff66` (gold)
- Public dimmed color: `#5e8c61` (pastel green) — used for secondary text on public pages via `.dimmed` class
- Admin dimmed color: `#c8b87a` (pastel yellow) — used for secondary text on admin pages via `.admin-dimmed` class
- Structural dimmed color: `#333340` (dark grey) — used for borders, separators, and non-text decorative elements only
- Link color: `#009900` (dark green), with `#00cc00` on hover
- Font: `"Source Code Pro", monospace`

The header for logged-in users SHALL display the user's three-color hash identity (colored text segments with colored square glyphs) linking to `/account`, replacing the previous avatar + username + Account + Logout links. The header for logged-out users SHALL continue to display the login link.

#### Scenario: Dark background renders
- **WHEN** any page loads in a browser
- **THEN** the page background is `#0f0f23` and text is `#cccccc` in a monospace font

#### Scenario: Links use green color scheme
- **WHEN** links are rendered
- **THEN** they appear in `#009900` and change to `#00cc00` on hover with no underline by default

#### Scenario: Public dimmed text is pastel green
- **WHEN** secondary text is rendered on a public page using the `.dimmed` class
- **THEN** the text color is `#5e8c61`

#### Scenario: Admin dimmed text is pastel yellow
- **WHEN** secondary text is rendered on an admin page using the `.admin-dimmed` class
- **THEN** the text color is `#c8b87a`

#### Scenario: Logged-in header shows hash identity
- **WHEN** a logged-in user views any page
- **THEN** the header displays their 18-char hash as three colored 6-char segments separated by hyphens, followed by three colored square glyphs, linking to `/account`
- **AND** no avatar image, GitHub username, or separate Account/Logout links are shown in the header

#### Scenario: Logged-out header unchanged
- **WHEN** a logged-out user views any page
- **THEN** the header displays the login link as before

### Requirement: Deleted poll row styling
The CSS SHALL provide styling for soft-deleted poll rows in the admin dashboard. Deleted rows SHALL have strikethrough text on the title and a muted visual treatment to distinguish them from active polls.

#### Scenario: Deleted row renders with strikethrough
- **WHEN** a poll row has the `.deleted-row` class
- **THEN** the poll title text has `text-decoration: line-through` and the row has reduced opacity or muted coloring

#### Scenario: Deleted status badge
- **WHEN** a poll has been soft-deleted
- **THEN** a `[deleted]` badge is displayed in a muted red color (`#aa4444`)
