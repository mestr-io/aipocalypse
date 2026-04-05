## Why

The app currently assumes it is served from the site root and generates absolute URLs like `/`, `/public/style.css`, and `/auth/login`. That breaks deployments behind nginx path prefixes such as `https://labs.mestr.io/aipocalypse/`, causing navigation, assets, forms, redirects, and OAuth callbacks to point to the wrong location.

## What Changes

- Add application support for a configurable base path so generated URLs work correctly when the app is mounted under a path prefix.
- Update route-generated links, form actions, static asset references, and redirects to respect the configured base path.
- Update OAuth callback URL generation so GitHub authentication works correctly behind a prefixed path.
- Document how to configure nginx and the app for deployments under `/aipocalypse/`.

## Capabilities

### New Capabilities
- `base-path-config`: Support serving the app from a configurable URL base path such as `/aipocalypse` while preserving root-path behavior by default.

### Modified Capabilities
- `hosting-guide`: Update deployment guidance to document path-prefixed hosting on `https://labs.mestr.io/aipocalypse/`.
- `public-poll-views`: Update public navigation, poll links, form actions, and redirects so they resolve correctly under a configured base path.
- `account-data-management`: Update account page navigation and account-related actions to resolve correctly under a configured base path.
- `privacy-page`: Update privacy page navigation and links to resolve correctly under a configured base path.
- `admin-auth`: Update admin login/logout flows and related redirects to resolve correctly under a configured base path.
- `admin-poll-crud`: Update admin poll list/create/delete flows and redirects to resolve correctly under a configured base path.
- `admin-poll-edit`: Update admin poll edit/publish/hide flows and redirects to resolve correctly under a configured base path.

## Impact

- Affected code: shared layout/views, route handlers, auth callback URL generation, admin routes, and hosting documentation.
- No new runtime dependency is expected.
- Default behavior must remain unchanged when no base path is configured.
- GitHub OAuth app configuration may need its callback URL updated to include the deployment path prefix.
