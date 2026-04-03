## Requirements

### Requirement: Admin login page
The application SHALL serve a login form at `GET /admin/login` that accepts a password. The login page SHALL use the admin layout (no public auth section, no footer, no privacy notice). The login page nav SHALL display "AIPocalypse Admin" without a logout link.

#### Scenario: Login page renders
- **WHEN** a browser requests `GET /admin/login`
- **THEN** the server responds with 200 and an HTML page containing a password input field and a submit button

#### Scenario: Login page uses admin layout
- **WHEN** the admin login page renders
- **THEN** the page does NOT contain "Sign in with GitHub", a footer, or a privacy link

### Requirement: Admin password authentication
The application SHALL authenticate the admin by comparing the submitted password against the `ADMIN_PASSWORD` environment variable.

#### Scenario: Correct password
- **WHEN** a POST request to `/admin/login` includes the correct password
- **THEN** the server sets an `admin_session` cookie and redirects to `GET /admin`

#### Scenario: Incorrect password
- **WHEN** a POST request to `/admin/login` includes an incorrect password
- **THEN** the server responds with 401 and re-renders the login form with an error message

#### Scenario: Missing ADMIN_PASSWORD env var
- **WHEN** `ADMIN_PASSWORD` is not set in the environment
- **THEN** all admin login attempts SHALL be rejected with a 500 error

### Requirement: Admin session cookie
The `admin_session` cookie SHALL contain an HMAC-signed token using `ADMIN_PASSWORD` as the signing key. The cookie SHALL be `HttpOnly`, `SameSite=Strict`, and `Path=/admin`.

#### Scenario: Cookie is set on login
- **WHEN** admin logs in successfully
- **THEN** the response includes a `Set-Cookie` header with `admin_session`, `HttpOnly`, `SameSite=Strict`, and `Path=/admin`

#### Scenario: Cookie contains signed token
- **WHEN** the `admin_session` cookie is read by the server
- **THEN** the server verifies the HMAC signature before granting access

### Requirement: Admin guard middleware
All routes under `/admin/*` (except `/admin/login`) SHALL be protected by middleware that verifies the `admin_session` cookie.

#### Scenario: Valid session cookie
- **WHEN** a request to `/admin/*` includes a valid `admin_session` cookie
- **THEN** the request proceeds to the route handler

#### Scenario: Missing or invalid session cookie
- **WHEN** a request to `/admin/*` has no cookie or an invalid cookie
- **THEN** the server redirects to `GET /admin/login`

### Requirement: Admin logout
The application SHALL provide a logout mechanism at `GET /admin/logout` that clears the admin session. The logout link SHALL be displayed in the admin layout nav bar on all authenticated admin pages, with text "logout from admin site".

#### Scenario: Logout clears session
- **WHEN** a browser requests `GET /admin/logout`
- **THEN** the `admin_session` cookie is cleared and the browser is redirected to `/admin/login`

#### Scenario: Logout link visible on all authenticated pages
- **WHEN** any authenticated admin page renders (dashboard, poll edit, poll create)
- **THEN** the nav bar contains a "logout from admin site" link pointing to `/admin/logout`
