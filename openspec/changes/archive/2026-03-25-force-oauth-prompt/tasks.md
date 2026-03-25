## 1. Implementation

- [x] 1.1 Add `prompt: "select_account"` to the `URLSearchParams` in `src/auth/routes.ts` login route

## 2. Documentation

- [x] 2.1 Update `docs/github-oauth.md` — add `prompt` to the authorize URL parameters table

## 3. Verification

- [x] 3.1 Run `bun test` to verify no regressions — 69/69 pass
- [x] 3.2 Manual test: log out, click "Sign in with GitHub", confirm GitHub account picker appears
