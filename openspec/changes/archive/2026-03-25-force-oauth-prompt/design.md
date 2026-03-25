## Context

GitHub OAuth Apps auto-complete the authorization flow when a user has already authorized the app and the requested scopes are a subset of what's been granted. Since AIPocalypse requests no scopes, every return visit skips GitHub's consent screen entirely — the user clicks "Sign in", blinks, and is already logged in. After logout this feels broken.

## Goals / Non-Goals

**Goals:**
- After logout, clicking "Sign in with GitHub" shows a visible GitHub page before re-authenticating.

**Non-Goals:**
- Revoking the GitHub OAuth authorization on logout (destructive, bad UX for quick re-login).
- Implementing local login or any alternative auth providers.

## Decisions

**Use `prompt=select_account` on the authorize URL.**

GitHub's `/login/oauth/authorize` endpoint supports a `prompt` parameter. The only documented value is `select_account`, which forces the account picker to appear even for previously authorized apps. This gives the user a visible pause point — they see a GitHub page, confirm their account, and proceed.

**Alternative considered: no change, document as expected behavior.** GitHub's silent re-auth is by design and not a bug. However, the UX is confusing enough to warrant the one-line fix.

**Alternative considered: revoke OAuth token on logout via GitHub API.** This would force full re-consent on next login, but it's heavy-handed — requires storing or re-fetching the token, makes an API call on every logout, and slows down re-login for users who just misclicked.

## Risks / Trade-offs

- **Account picker on every login** — Users who want instant re-login now see one extra click. Acceptable trade-off for clarity.
- **GitHub could remove or change `prompt` behavior** — It's a documented parameter. Low risk.
