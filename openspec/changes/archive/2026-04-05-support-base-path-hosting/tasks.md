## 1. Base path configuration

- [x] 1.1 Add shared configuration/helpers to normalize `APP_BASE_PATH` and build prefixed application URLs.
- [x] 1.2 Add focused tests for base-path normalization and URL generation behavior.

## 2. Public and account-facing URLs

- [x] 2.1 Update shared layout, public views, and static asset references to use base-path-aware URLs.
- [x] 2.2 Update public route handlers and account route handlers so redirects and form actions use the configured base path.

## 3. Admin and auth flows

- [x] 3.1 Update GitHub OAuth callback generation and auth redirects to honor `APP_BASE_PATH`.
- [x] 3.2 Update admin layout, admin routes, and admin form actions/redirects to honor `APP_BASE_PATH`.

## 4. Hosting documentation

- [x] 4.1 Update `docs/hosting.md` to document `APP_BASE_PATH=/aipocalypse` and nginx configuration for `https://labs.mestr.io/aipocalypse/`.
- [x] 4.2 Document GitHub OAuth callback requirements for path-prefixed deployment and add verification/troubleshooting notes.
