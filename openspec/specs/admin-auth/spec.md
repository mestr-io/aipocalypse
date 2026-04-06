## Purpose

Define admin password authentication, session handling, access control, and logout behavior for the admin interface.
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
The application SHALL authenticate the admin by comparing the submitted password against the `ADMIN_PASSWORD` environment variable after the request passes CSRF validation and is not currently throttled.

#### Scenario: Correct password
- **WHEN** a POST request to `/admin/login` includes a valid CSRF token, is not rate limited, and includes the correct password
- **THEN** the server sets an `admin_session` cookie and redirects to `GET /admin`

#### Scenario: Incorrect password
- **WHEN** a POST request to `/admin/login` includes a valid CSRF token, is not rate limited, and includes an incorrect password
- **THEN** the server responds with 401 and re-renders the login form with an error message

#### Scenario: Missing ADMIN_PASSWORD env var
- **WHEN** `ADMIN_PASSWORD` is not set in the environment
- **THEN** all admin login attempts SHALL be rejected with a 500 error

### Requirement: Admin session cookie
The `admin_session` cookie SHALL contain an HMAC-signed token using `ADMIN_SESSION_SECRET` as the signing key. The token SHALL encode issue time and expiration time. The cookie SHALL be `HttpOnly`, `SameSite=Strict`, `Path=/admin`, and have a max age that does not exceed 12 hours. On non-localhost deployments, the cookie SHALL also be `Secure`.

#### Scenario: Cookie is set on login
- **WHEN** admin logs in successfully
- **THEN** the response includes a `Set-Cookie` header with `admin_session`, `HttpOnly`, `SameSite=Strict`, `Path=/admin`, and a max-age no greater than 12 hours

#### Scenario: Cookie contains signed token
- **WHEN** the `admin_session` cookie is read by the server
- **THEN** the server verifies the HMAC signature and the token expiration before granting access

#### Scenario: Cookie is secure outside localhost
- **WHEN** the application serves the admin login flow on a non-localhost origin
- **THEN** the `Set-Cookie` header for `admin_session` includes the `Secure` attribute

### Requirement: Admin guard middleware
All routes under `/admin/*` (except `/admin/login`) SHALL be protected by middleware that verifies the `admin_session` cookie and rejects expired sessions.

#### Scenario: Valid session cookie
- **WHEN** a request to `/admin/*` includes a valid, unexpired `admin_session` cookie
- **THEN** the request proceeds to the route handler

#### Scenario: Missing or invalid session cookie
- **WHEN** a request to `/admin/*` has no cookie or an invalid cookie
- **THEN** the server redirects to `GET /admin/login`

#### Scenario: Expired session cookie
- **WHEN** a request to `/admin/*` includes an expired `admin_session` cookie
- **THEN** the server redirects to `GET /admin/login`

### Requirement: Admin logout
The application SHALL provide a logout mechanism at `GET /admin/logout` that clears the admin session. The logout link SHALL be displayed in the admin layout nav bar on all authenticated admin pages, with text "logout from admin site".

#### Scenario: Logout clears session
- **WHEN** a browser requests `GET /admin/logout`
- **THEN** the `admin_session` cookie is cleared and the browser is redirected to `/admin/login`

#### Scenario: Logout link visible on all authenticated pages
- **WHEN** any authenticated admin page renders (dashboard, poll edit, poll create)
- **THEN** the nav bar contains a "logout from admin site" link pointing to `/admin/logout`

### Requirement: Admin auth flows generate base-path-aware URLs
Admin login, logout, protected-route redirects, and admin navigation SHALL use the configured application base path.

#### Scenario: Admin login and logout honor base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an admin uses login or logout flows
- **THEN** login form actions, logout links, successful login redirects, and logout redirects resolve under `/aipocalypse/admin`

#### Scenario: Admin guard redirect honors base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and an unauthenticated request targets an admin route
- **THEN** the redirect target resolves to `/aipocalypse/admin/login`

### Requirement: OAuth callback generation honors base path
The GitHub OAuth callback URL SHALL include the configured application base path.

#### Scenario: OAuth callback uses base path
- **WHEN** `APP_BASE_PATH` is `/aipocalypse` and the app generates the GitHub OAuth callback URL
- **THEN** the callback URL resolves to `/aipocalypse/auth/callback`

### Requirement: Admin login throttling
The application SHALL throttle repeated failed admin login attempts from the same client key. After 5 failed attempts within a 15-minute window, additional `POST /admin/login` requests from that client key SHALL be rejected with `429 Too Many Requests` until the window expires. A successful admin login SHALL reset the failed-attempt counter for that client key.

#### Scenario: Client is rate limited after repeated failures
- **WHEN** the same client submits 5 invalid passwords to `POST /admin/login` within 15 minutes and then submits another login attempt
- **THEN** the application responds with `429 Too Many Requests`
- **AND** no admin session cookie is created

#### Scenario: Successful login resets failed-attempt counter
- **WHEN** a client has accumulated failed admin login attempts and then submits the correct password before reaching the throttle limit
- **THEN** the application authenticates the admin normally
- **AND** the failed-attempt counter for that client is cleared

### Requirement: Admin state-changing routes require CSRF tokens
The application SHALL require a valid CSRF token on every admin POST route, including `POST /admin/login`, `POST /admin/polls`, and `POST /admin/polls/:id`. Admin HTML forms SHALL render the token as a hidden field.

#### Scenario: Admin login form renders CSRF token
- **WHEN** a browser requests `GET /admin/login`
- **THEN** the HTML form contains a hidden CSRF token field

#### Scenario: Admin poll mutation without valid CSRF token is rejected
- **WHEN** a request to `POST /admin/polls` or `POST /admin/polls/:id` omits the CSRF token or includes an invalid token
- **THEN** the application responds with `403 Forbidden`
- **AND** no poll data is created or updated

