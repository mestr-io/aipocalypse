## Context

AIPocalypse is currently implemented as a root-mounted server-rendered app. Templates and route handlers generate absolute paths beginning with `/`, and the OAuth callback URL is derived without awareness of a deployment path prefix. The app now runs correctly behind rootless Podman and nginx, but the chosen production URL is `https://labs.mestr.io/aipocalypse/`, which requires the app to behave correctly when mounted under a non-root base path.

This is a cross-cutting change because it affects shared layout rendering, public pages, admin pages, redirects, static asset references, and OAuth callback generation. A design document is useful so the path-prefix behavior stays consistent instead of being patched ad hoc.

## Goals / Non-Goals

**Goals:**
- Support a configurable application base path such as `/aipocalypse`.
- Keep root deployment as the default behavior when no base path is configured.
- Ensure rendered links, redirects, form actions, static asset URLs, and OAuth callback URLs all honor the configured base path.
- Document nginx and app configuration for path-prefixed hosting.

**Non-Goals:**
- Introduce client-side routing or a frontend framework.
- Support arbitrary per-request base path discovery from proxy headers.
- Change route semantics inside Hono beyond prefix-aware URL generation.
- Redesign the information architecture of public or admin pages.

## Decisions

### 1. Use an explicit `APP_BASE_PATH` configuration value
The app will use a single config value, `APP_BASE_PATH`, to represent the externally visible path prefix. It will default to an empty string.

Rationale:
- Makes deployment explicit and predictable.
- Avoids fragile inference from reverse-proxy behavior.
- Keeps local development simple.

Alternatives considered:
- Infer the base path from request URLs alone: rejected because internal app routes do not contain the external prefix after nginx strips it.
- Hardcode `/aipocalypse`: rejected because the app should remain reusable for root deployments and other prefixes.

### 2. Centralize path joining in a helper
A shared helper will normalize the base path and build prefixed URLs from app-relative paths.

Rationale:
- Prevents repeated string concatenation bugs.
- Ensures consistent handling of slashes.
- Makes view/template code easy to audit.

Alternatives considered:
- Manual string concatenation in each view and route: rejected because it is error-prone and hard to maintain.

### 3. Pass base-path helpers into rendering and redirects
Views and route handlers will use the shared helper for all app-generated URLs including static assets, navigation links, form actions, redirects, and callback generation.

Rationale:
- The current breakage comes from multiple URL-generation sites, not just one template.
- Applying the helper consistently is the simplest way to make prefixed hosting reliable.

Alternatives considered:
- Solve only static assets or only redirects first: rejected because the deployment would remain partially broken.

### 4. Preserve internal Hono routes unchanged
The app will continue registering routes at `/`, `/poll/:id`, `/auth/...`, `/admin/...`, etc. nginx will continue stripping the external prefix before forwarding requests.

Rationale:
- Minimizes routing churn in the application.
- Matches the existing reverse-proxy setup.
- Limits this change to URL generation rather than route remapping.

Alternatives considered:
- Register every route under `/aipocalypse`: rejected because it would complicate development and make root hosting worse.

## Risks / Trade-offs

- [Missed absolute URL in a template or redirect] → Audit all `href`, `action`, redirect, and asset references and add focused tests where practical.
- [Malformed base path values like `aipocalypse/` or `/aipocalypse/`] → Normalize `APP_BASE_PATH` once in the helper to a canonical form.
- [OAuth callback mismatch in GitHub app settings] → Document that the GitHub OAuth callback URL must include the deployed base path.
- [Future pages forget to use the helper] → Keep helper usage simple and place it in shared rendering/config code.

## Migration Plan

1. Add base-path config and URL helper utilities.
2. Update shared layout and public/admin views to use prefixed URLs.
3. Update redirect destinations and OAuth callback generation to use the helper.
4. Add/adjust tests for URL generation behavior where current coverage exists.
5. Update hosting documentation and nginx guidance for `https://labs.mestr.io/aipocalypse/`.

Rollback strategy:
- Set `APP_BASE_PATH` back to empty and deploy previous behavior.
- Because root behavior remains the default, rollback is low risk.

## Open Questions

- Whether to expose the configured base path to all views via a single render context helper instead of individual function parameters.
- Whether to add a dedicated deployment example for both root hosting and prefixed hosting in the docs.
