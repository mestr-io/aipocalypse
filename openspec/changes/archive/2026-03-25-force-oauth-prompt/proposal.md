## Why

After logging out, clicking "Sign in with GitHub" immediately re-authenticates the user without showing any GitHub screen. This happens because GitHub remembers the OAuth authorization for the app — once a user has authorized an OAuth App with no scopes, subsequent authorize requests auto-complete silently. The result is confusing: the user expects to see a GitHub page but is instantly logged back in.

## What Changes

- Add `prompt=select_account` to the GitHub OAuth authorize URL in the login route. This forces GitHub to show the account picker, giving the user a visible confirmation step before re-authenticating.
- No changes to logout — the session cookie is already cleared correctly.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a one-parameter addition to the OAuth authorize URL — no spec-level behavior changes. The auth flow contract (login → GitHub → callback → session) stays the same.

## Impact

- `src/auth/routes.ts` — add `prompt` parameter to the authorize URL query string.
- No database changes, no new dependencies, no breaking changes.
