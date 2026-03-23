# GitHub OAuth

AIPocalypse uses **GitHub OAuth Apps** (not GitHub Apps) to authenticate users. The flow follows the standard [OAuth 2.0 authorization code grant](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow).

## OAuth App registration

Register the app at **GitHub > Settings > Developer settings > OAuth Apps > New OAuth App**.

| Field | Value |
|-------|-------|
| Application name | `AIPocalypse` |
| Homepage URL | `https://mestr.io/labs/aipocalypse` |
| Authorization callback URL | `https://mestr.io/labs/aipocalypse/auth/callback` |

For local development, register a **second** OAuth App with:

| Field | Value |
|-------|-------|
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/auth/callback` |

OAuth Apps can only have **one** callback URL. You need separate apps for production and development.

After registration, copy the **Client ID** and **Client Secret** into your `.env`:

```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

## Scopes

The app requests **no scopes** (empty scope). With no scopes, the token grants read-only access to the user's public GitHub profile — which is all we need. The user sees a minimal consent screen.

The `GET /user` API response with no scopes includes:

- `id` — stable numeric GitHub user ID
- `login` — GitHub username
- `name` — display name
- `avatar_url` — profile picture URL

No access to private repos, emails, or any write operations.

## Authorization flow

### Overview

```
Browser                  AIPocalypse                GitHub
  │                          │                        │
  │  GET /auth/login         │                        │
  │─────────────────────────>│                        │
  │                          │  generate state        │
  │                          │  store in cookie       │
  │  302 Redirect            │                        │
  │<─────────────────────────│                        │
  │                                                   │
  │  GET /login/oauth/authorize?client_id&state&...   │
  │──────────────────────────────────────────────────>│
  │                                                   │
  │                          User authorizes app      │
  │                                                   │
  │  302 Redirect to /auth/callback?code&state        │
  │<──────────────────────────────────────────────────│
  │                          │                        │
  │  GET /auth/callback      │                        │
  │─────────────────────────>│                        │
  │                          │  validate state        │
  │                          │                        │
  │                          │  POST /access_token    │
  │                          │───────────────────────>│
  │                          │  { access_token }      │
  │                          │<───────────────────────│
  │                          │                        │
  │                          │  GET /user             │
  │                          │───────────────────────>│
  │                          │  { id, login, ... }    │
  │                          │<───────────────────────│
  │                          │                        │
  │                          │  upsert user in DB     │
  │                          │  set session cookie    │
  │  302 Redirect to /       │                        │
  │<─────────────────────────│                        │
```

### Step 1 — Redirect to GitHub

When the user clicks "Sign in with GitHub", the app redirects to:

```
GET https://github.com/login/oauth/authorize
  ?client_id={GITHUB_CLIENT_ID}
  &redirect_uri=https://mestr.io/labs/aipocalypse/auth/callback
  &scope=
  &state={random_string}
```

**Parameters:**

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `client_id` | From env | Identifies the OAuth App |
| `redirect_uri` | `/auth/callback` (full URL) | Where GitHub sends the user back |
| `scope` | Empty string | Request only public profile access |
| `state` | Random unguessable string | CSRF protection |

The `state` value is generated per-request (e.g., 32-byte random hex) and stored in an HTTP-only cookie so it can be verified in the callback.

### Step 2 — Handle the callback

GitHub redirects back to `/auth/callback?code={code}&state={state}`.

The server must:

1. **Validate `state`** — compare the `state` query parameter against the value stored in the cookie. If they don't match, abort (possible CSRF attack).
2. **Exchange the code for an access token** — make a server-side POST:

```
POST https://github.com/login/oauth/access_token
Accept: application/json

{
  "client_id": "{GITHUB_CLIENT_ID}",
  "client_secret": "{GITHUB_CLIENT_SECRET}",
  "code": "{code}",
  "redirect_uri": "https://mestr.io/labs/aipocalypse/auth/callback"
}
```

Response:

```json
{
  "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
  "scope": "",
  "token_type": "bearer"
}
```

3. **Fetch the user profile** — use the access token to call the GitHub API:

```
GET https://api.github.com/user
Authorization: Bearer {access_token}
```

Response (relevant fields):

```json
{
  "id": 12345678,
  "login": "octocat",
  "name": "The Octocat",
  "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4"
}
```

4. **Upsert the user** — insert or update the `users` table keyed on `githubId`. Update `name`, `githubUser`, and `avatarUrl` on every login since these can change on GitHub's side.

5. **Set the session** — store the user's `id` (our UUID v7, not the GitHub ID) in a signed, HTTP-only session cookie. Clear the `state` cookie.

6. **Redirect** — send the user to `/` (or wherever they came from).

### Step 3 — Authenticated requests

After login, the session cookie identifies the user. On each request to a protected route (`/vote/*`), the middleware:

1. Reads the session cookie.
2. Looks up the user by `id`.
3. Rejects the request if the user is not found, is banned, or the session is invalid.

No GitHub API calls are needed for authenticated requests — the session is self-contained.

## Token storage decision

**We do NOT store the GitHub access token in the database.**

Rationale:

- OAuth App tokens (prefix `gho_`) **do not expire** — they persist until the user revokes them. Storing them creates a long-lived secret in the database.
- This app only needs the token once during login to fetch the user's profile. After that, session cookies handle authentication.
- We don't make any ongoing GitHub API calls on behalf of users — there's no repo access, no webhooks, nothing beyond the initial profile fetch.
- Not storing tokens means a database leak doesn't expose GitHub access. Less data, less risk.

If a future feature requires GitHub API access after login (e.g., fetching repos or organizations), revisit this decision and add an encrypted `githubAccessToken` column to the `users` table.

## Logout

`GET /auth/logout` clears the session cookie and redirects to `/`. No GitHub token revocation is performed — the token was never stored and is discarded after the initial profile fetch.

## Session management

Sessions are cookie-based:

| Property | Value |
|----------|-------|
| Cookie name | `aipocalypse_session` |
| HttpOnly | `true` |
| Secure | `true` (production) |
| SameSite | `Lax` |
| Signed | Yes (with a server-side secret) |
| Contents | User `id` (UUID v7) |

The session cookie contains only the user's ID. All other user data is fetched from the database on each request that needs it.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | Yes | OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Yes | OAuth App client secret |

## Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/auth/login` | GET | Generate state, redirect to GitHub |
| `/auth/callback` | GET | Handle OAuth callback, exchange code, upsert user, set session |
| `/auth/logout` | GET | Clear session cookie, redirect to `/` |

## Security checklist

- [ ] `state` parameter generated with cryptographically secure randomness
- [ ] `state` validated on callback — reject mismatches
- [ ] `redirect_uri` sent explicitly in both the authorize and token exchange requests
- [ ] Access token transmitted only server-side (never exposed to the browser)
- [ ] Session cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, and signed
- [ ] Access token discarded after profile fetch — not stored in DB or session
- [ ] `GITHUB_CLIENT_SECRET` never exposed in client-side code or logs
