## Why

Admin pages currently use the shared public `layout()` function, which renders the GitHub OAuth login/logout section in the navbar, a privacy link in the footer, and the "we store minimal data" notice — none of which are relevant to the password-authenticated admin panel. This leaks public-facing chrome into a separate auth context, creating a confusing and unprofessional admin experience. The admin logout link is also buried at the bottom of the dashboard page rather than being persistently visible.

## What Changes

- Create a dedicated `adminLayout()` function that renders a clean admin shell: "AIPocalypse Admin" title linking to `/admin`, a `[logout from admin site]` nav link (only when authenticated), no footer, no GitHub auth section, no privacy notice.
- Switch all admin view templates (`dashboard`, `login`, `poll-form`) to use `adminLayout()` instead of `layout()`.
- Remove the inline logout link from the bottom of the dashboard page (it moves to the nav bar).
- The admin login page uses the admin layout but without the logout link (since the user isn't authenticated yet).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `aoc-theme`: Admin pages get a distinct layout shell — no public footer, no GitHub auth in nav, admin-specific nav with logout link. The shared AoC aesthetic (colors, font, dark background) still applies.
- `admin-auth`: The logout link moves from an inline dashboard element to the admin layout nav bar, visible on all authenticated admin pages. The login page uses the admin layout without the logout link.

## Impact

- `src/views/layout.ts` — unchanged (public layout stays as-is)
- `src/views/admin-layout.ts` — new file (admin-specific layout function)
- `src/views/admin/dashboard.ts` — switches to `adminLayout()`, removes inline logout link
- `src/views/admin/login.ts` — switches to `adminLayout()`
- `src/views/admin/poll-form.ts` — switches to `adminLayout()`
- `src/public/style.css` — may need minor admin nav styling adjustments
- No database changes, no route changes, no middleware changes
