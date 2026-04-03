## ADDED Requirements

### Requirement: Admin layout shell
Admin pages SHALL use a dedicated `adminLayout()` function that renders an HTML shell distinct from the public layout. The admin layout SHALL include the shared AoC stylesheet (`/public/style.css`) but SHALL NOT render the public GitHub auth section in the nav, the privacy notice, or the page footer.

#### Scenario: Admin page has no public auth section
- **WHEN** any admin page renders (dashboard, login, poll form)
- **THEN** the nav bar does NOT contain "Sign in with GitHub", user identity, or the public logout link

#### Scenario: Admin page has no footer
- **WHEN** any admin page renders
- **THEN** no `<footer>` element is present in the HTML output

#### Scenario: Admin page has no privacy notice
- **WHEN** any admin page renders
- **THEN** the HTML does NOT contain "we store minimal data" or a link to `/privacy`

### Requirement: Admin nav title
The admin layout nav SHALL display "AIPocalypse Admin" as the site title, linking to `/admin`.

#### Scenario: Admin nav title renders
- **WHEN** any admin page renders
- **THEN** the nav contains a link with text "AIPocalypse Admin" pointing to `/admin`

### Requirement: Admin nav logout link
The admin layout SHALL display a `[logout from admin site]` link in the nav bar when the page is rendered in an authenticated context.

#### Scenario: Authenticated admin page shows logout in nav
- **WHEN** an authenticated admin page renders (dashboard, poll form)
- **THEN** the nav bar contains a link with text "logout from admin site" pointing to `/admin/logout`

#### Scenario: Login page omits logout from nav
- **WHEN** the admin login page renders
- **THEN** the nav bar does NOT contain a logout link

## MODIFIED Requirements

### Requirement: Deleted poll row styling
The CSS SHALL provide styling for soft-deleted poll rows in the admin dashboard. Deleted rows SHALL have strikethrough text on the title and a muted visual treatment to distinguish them from active polls.

The admin dashboard SHALL NOT render an inline logout link at the bottom of the page. The logout link is provided by the admin layout nav bar.

#### Scenario: Deleted row renders with strikethrough
- **WHEN** a poll row has the `.deleted-row` class
- **THEN** the poll title text has `text-decoration: line-through` and the row has reduced opacity or muted coloring

#### Scenario: Deleted status badge
- **WHEN** a poll has been soft-deleted
- **THEN** a `[deleted]` badge is displayed in a muted red color (`#aa4444`)

#### Scenario: No inline logout link on dashboard
- **WHEN** the admin dashboard page renders
- **THEN** there is no logout link in the page content body (it appears only in the nav bar)
