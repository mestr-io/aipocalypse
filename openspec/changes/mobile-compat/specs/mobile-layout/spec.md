## ADDED Requirements

### Requirement: No horizontal scroll on mobile viewports
The site SHALL render without horizontal scrollbar on viewports from 320px to 768px wide across all public pages (home, poll detail, privacy, account).

#### Scenario: Home page on 320px viewport
- **WHEN** the home page is loaded on a 320px wide viewport
- **THEN** no horizontal scrollbar appears and all content is visible within the viewport width

#### Scenario: Poll detail page on 375px viewport
- **WHEN** a poll detail page is loaded on a 375px wide viewport
- **THEN** no horizontal scrollbar appears, progress bars and text wrap within viewport

### Requirement: Navigation stacks vertically on mobile
The navigation bar SHALL stack the site title and nav links vertically on viewports 768px and below, with adequate spacing between elements.

#### Scenario: Nav layout on mobile
- **WHEN** the page is viewed on a viewport 768px wide or less
- **THEN** the site title appears on its own line, nav links wrap below it, and all links remain accessible

### Requirement: Login notice hidden on mobile
The login notice parenthetical text SHALL be hidden on viewports 768px and below. The sign-in link itself SHALL remain visible.

#### Scenario: Unauthenticated user on mobile
- **WHEN** an unauthenticated user views any page on a mobile viewport
- **THEN** the "Sign in with GitHub" link is visible but the parenthetical "(stores a hashed identity...)" text is not displayed

### Requirement: Poll metadata wraps on narrow screens
The `.poll-meta` container SHALL wrap its children rather than overflow on narrow viewports.

#### Scenario: Poll card with due date and vote count on 320px
- **WHEN** a poll card with due date and vote count is rendered on a 320px viewport
- **THEN** the metadata items wrap to multiple lines rather than overflowing horizontally

### Requirement: Poll options readable on mobile
Poll option text and progress bars SHALL be fully visible on mobile viewports without truncation or overflow.

#### Scenario: Long option text on 375px viewport
- **WHEN** a poll detail page with long option text is viewed on a 375px viewport
- **THEN** option text wraps naturally and progress bars remain within the viewport width
