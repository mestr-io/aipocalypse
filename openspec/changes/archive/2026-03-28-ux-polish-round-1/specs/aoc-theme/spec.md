## MODIFIED Requirements

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

The header for logged-in users SHALL display the user's hash identity with green-colored text segments and per-segment-colored square glyphs, linking to `/account`. The header for logged-out users SHALL continue to display the login link.

The account page SHALL have a visually separated logout section, using a top border and spacing consistent with the `.section-heading` pattern. Account page sections (export, delete, logout) SHALL have `margin-top: 2rem` between them for adequate vertical breathing room.

Context links in `.poll-links a` SHALL use dimmed green (`#5e8c61`) by default and brighten to `#00cc00` on hover, distinguishing them from primary navigation links.

The `.voted-badge` class SHALL render text in dimmed green (`#5e8c61`) with `font-size: 0.9em`.

The account page delete section SHALL use an inline CSS-only slide-reveal pattern instead of a browser `confirm()` dialog. The `.delete-slide` container uses `overflow: hidden` with a fixed width. A hidden checkbox toggles a `.delete-slide-track` that shifts via `transform: translateX` to reveal confirmation buttons: "[No... keep my account]" in green and "[Yes, delete my account]" in red (`.btn-danger` with background `#aa4444`, hover `#cc5555`).

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
- **THEN** the header displays their 18-char hash as three green-colored 6-char text segments separated by hyphens, followed by three per-segment-colored square glyphs, linking to `/account`
- **AND** no avatar image, GitHub username, or separate Account/Logout links are shown in the header

#### Scenario: Logged-out header unchanged
- **WHEN** a logged-out user views any page
- **THEN** the header displays the login link as before

#### Scenario: Account page logout separation
- **WHEN** a logged-in user views the account page
- **THEN** the logout link is visually separated from the delete-account section by a top border and vertical spacing

#### Scenario: Account page section spacing
- **WHEN** a logged-in user views the account page
- **THEN** the export, delete, and logout sections have `margin-top: 2rem` between them

#### Scenario: Poll context links use dimmed green
- **WHEN** context links are rendered on a poll detail page
- **THEN** `.poll-links a` links appear in `#5e8c61` and change to `#00cc00` on hover

#### Scenario: Voted badge styling
- **WHEN** a voted badge is rendered on a poll list card
- **THEN** the badge text is `#5e8c61` with `font-size: 0.9em`

#### Scenario: Delete slide-reveal initial state
- **WHEN** a logged-in user views the account page
- **THEN** the delete section shows a "Delete my account" button and the confirmation buttons are hidden (clipped by `overflow: hidden`)

#### Scenario: Delete slide-reveal activated
- **WHEN** the user clicks "Delete my account"
- **THEN** the track slides left to reveal "[No... keep my account]" (green) and "[Yes, delete my account]" (red, `.btn-danger` background `#aa4444`)

#### Scenario: Delete slide-reveal cancelled
- **WHEN** the user clicks "[No... keep my account]"
- **THEN** the track slides back to the initial state showing only the "Delete my account" button

#### Scenario: Delete slide-reveal confirmed
- **WHEN** the user clicks "[Yes, delete my account]"
- **THEN** the form submits a POST to `/account/delete`

#### Scenario: Delete slide graceful degradation
- **WHEN** CSS fails to load
- **THEN** both the initial button and the confirmation buttons are visible, and the form still submits correctly via the submit button
