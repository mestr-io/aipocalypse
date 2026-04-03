## MODIFIED Requirements

### Requirement: Admin login page
The application SHALL serve a login form at `GET /admin/login` that accepts a password. The login page SHALL use the admin layout (no public auth section, no footer, no privacy notice). The login page nav SHALL display "AIPocalypse Admin" without a logout link.

#### Scenario: Login page renders
- **WHEN** a browser requests `GET /admin/login`
- **THEN** the server responds with 200 and an HTML page containing a password input field and a submit button

#### Scenario: Login page uses admin layout
- **WHEN** the admin login page renders
- **THEN** the page does NOT contain "Sign in with GitHub", a footer, or a privacy link

### Requirement: Admin logout
The application SHALL provide a logout mechanism at `GET /admin/logout` that clears the admin session. The logout link SHALL be displayed in the admin layout nav bar on all authenticated admin pages, with text "logout from admin site".

#### Scenario: Logout clears session
- **WHEN** a browser requests `GET /admin/logout`
- **THEN** the `admin_session` cookie is cleared and the browser is redirected to `/admin/login`

#### Scenario: Logout link visible on all authenticated pages
- **WHEN** any authenticated admin page renders (dashboard, poll edit, poll create)
- **THEN** the nav bar contains a "logout from admin site" link pointing to `/admin/logout`
