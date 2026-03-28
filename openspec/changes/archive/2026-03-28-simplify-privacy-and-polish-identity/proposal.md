## Why

The privacy page is overengineered for a community poll site — it displays raw `CREATE TABLE` SQL DDL and reads like a compliance document rather than a simple transparency notice. Users just need to know we store a hashed ID and nothing else. Additionally, the hashed identity segments (e.g., `db3992-db0c21-113ec8`) use their hex values as inline colors, which often produces illegible or clashing results. They should use the standard green link color for consistency. Finally, the logout link on the account page lacks visual separation from the delete-account section above it.

## What Changes

- **Replace the verbose privacy page** with a minimal notice: we store a one-way hash of your GitHub ID (not your username, avatar, or token), a session cookie, and your votes. Remove all `CREATE TABLE` DDL, the cookies table, and the legal-basis section. Keep the GDPR rights summary and link to the account page.
- **Update the footer** privacy link text from "Privacy" to something lighter (or keep, but point to the simplified page).
- **Change hashed ID display color** — the `renderIdentity` function currently colors each 6-char segment using the segment's hex value as an inline CSS color. Change this so the hash text always renders in the standard green link color (`#009900`), while keeping the three square glyphs (`■`) colored with their segment hex values as a visual fingerprint.
- **Improve account page layout** — add a visual separator (border-top or margin) before the logout link so it doesn't feel crammed against the danger-zone delete section.
- **Add tests** for `renderIdentity` output format, the privacy page content (no DDL present), and the account page structure (logout link separation).
- **Update docs** — revise `docs/architecture.md` project structure notes if the privacy page description changes, and update `docs/models.md` if it references the privacy page's DDL display.

## Capabilities

### New Capabilities

_None_ — all changes modify existing capabilities.

### Modified Capabilities

- `hash-identity-system`: The three-color identity rendering requirement changes — hash text segments use green link color instead of segment-derived hex colors; only the square glyphs retain per-segment coloring.
- `aoc-theme`: The logged-in header identity scenario updates to reflect the new green-text rendering. Account page gains a styled separator before the logout action.

## Impact

- `src/views/identity.ts` — change how hash text segments are colored
- `src/views/privacy.ts` — rewrite to minimal notice (no DDL)
- `src/views/account.ts` — add separator before logout link
- `src/public/style.css` — add `.account-logout` separator styling, possibly `.identity` text color rule
- `src/views/identity.test.ts` — new test file for renderIdentity
- `src/views/privacy.test.ts` — new test file for privacy page content
- `src/views/account.test.ts` — new test file for account page structure
- `docs/architecture.md` — minor updates if privacy page description changes
- `openspec/specs/hash-identity-system/spec.md` — update three-color rendering requirement
- `openspec/specs/aoc-theme/spec.md` — update identity display and account page scenarios
