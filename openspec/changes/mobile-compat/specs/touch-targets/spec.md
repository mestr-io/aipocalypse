## ADDED Requirements

### Requirement: Poll cards are fully clickable
The entire poll card area SHALL be a clickable link to the poll detail page, not just the title text. The visual appearance of the card SHALL not change.

#### Scenario: Tapping anywhere on a poll card
- **WHEN** a user taps anywhere within the poll card boundary (title, preview text, or metadata area)
- **THEN** the user is navigated to that poll's detail page

#### Scenario: Visual appearance unchanged
- **WHEN** poll cards are rendered on any viewport
- **THEN** the card looks identical to the current design — same colors, borders, hover behavior

### Requirement: Navigation links meet minimum touch target
Navigation links (site title, sign-in, logout, privacy) SHALL have a minimum touch target height of 44px on mobile viewports.

#### Scenario: Nav link touch target on mobile
- **WHEN** the navigation is rendered on a viewport 768px wide or less
- **THEN** each nav link has at least 44px of combined height (content + padding)

### Requirement: Poll option touch targets meet minimum size
Poll option rows on the detail page SHALL have a minimum touch target height of 44px on all viewports.

#### Scenario: Poll option tappability
- **WHEN** a poll detail page with voting enabled is viewed on a mobile viewport
- **THEN** each poll option row has at least 44px of tap area height

### Requirement: Footer links meet minimum touch target
Footer links SHALL have a minimum touch target height of 44px on mobile viewports.

#### Scenario: Footer privacy link on mobile
- **WHEN** the footer is rendered on a viewport 768px wide or less
- **THEN** the privacy link has at least 44px of combined height (content + padding)

### Requirement: Buttons meet minimum touch target
All buttons (vote submit, form buttons) SHALL have a minimum touch target height of 44px on mobile viewports.

#### Scenario: Vote button on mobile
- **WHEN** the vote form is displayed on a mobile viewport
- **THEN** the submit button has at least 44px of tap area height
