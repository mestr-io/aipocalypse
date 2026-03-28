## Context

The privacy page (`src/views/privacy.ts`) currently displays raw `CREATE TABLE` SQL DDL for the `users` and `answers` tables, a cookies table, and legal-basis references. This is excessive for a community poll site — users need transparency, not a database schema dump. The page also references internal column names that could change without notice.

The identity rendering system (`src/views/identity.ts`) colors each 6-char hash segment using the segment's own hex value as an inline CSS color (e.g., `color:#db3992`). This produces unpredictable colors — some segments are near-black, near-white, or clash with the dark background, making the hash text illegible. The square glyphs serve as the visual fingerprint and work well with per-segment colors.

The account page (`src/views/account.ts`) places the logout link directly below the danger-zone delete section with no visual separation, making it feel like part of the destructive actions area.

## Goals / Non-Goals

**Goals:**
- Replace the verbose privacy page with a concise, human-readable notice
- Make hashed ID text consistently readable by using green link color (`#009900`)
- Keep the colored square glyphs as the visual fingerprint
- Add clear visual separation for the logout action on the account page
- Add tests for identity rendering, privacy content, and account structure
- Update specs and docs to reflect these changes

**Non-Goals:**
- Changing the hash computation algorithm or storage format
- Adding new GDPR functionality (export/delete already exist)
- Redesigning the account page layout beyond the logout separator
- Changing the identity link destination (still goes to `/account`)

## Decisions

### 1. Identity text segments use green, glyphs keep per-segment colors

**Decision:** Change `renderIdentity` so the three hash text segments (`db3992-db0c21-113ec8`) use the standard green link color (`#009900`) instead of `color:#segment`. The three square glyphs (`■■■`) continue using per-segment hex colors.

**Rationale:** The hash text needs to be legible on the `#0f0f23` background. Using the link-green ensures consistency with the AoC terminal aesthetic. The colored glyphs provide the distinctive visual fingerprint without legibility issues (small solid blocks are visible at any hue).

**Alternative considered:** Using a brightness-adjusted version of each segment's color — rejected because it adds complexity and still won't match the site's green theme.

### 2. Privacy page becomes a minimal notice

**Decision:** Replace the full privacy page with a short notice covering: (1) we store a one-way hash of your GitHub ID, (2) we don't store your username/avatar/token, (3) session cookie for login, (4) your votes, (5) your GDPR rights with link to account page, (6) link to source code.

**Rationale:** The DDL display adds no transparency for non-technical users and is a maintenance liability. The essential information fits in 10 lines of prose.

**Alternative considered:** Keeping a collapsible "technical details" section — rejected for simplicity. Source code link serves that purpose.

### 3. Account page logout separator via CSS class

**Decision:** Add a `section-heading`-style separator before the logout link using a top border and margin, wrapped in a distinct section. Reuse the existing `.section-heading` pattern or add a simple `.account-actions` class.

**Rationale:** Consistent with existing section-heading separators in the codebase. Pure CSS solution, no structural HTML changes beyond wrapping.

### 4. Test strategy

**Decision:** Create three new test files:
- `src/views/identity.test.ts` — tests `renderIdentity` output: green-colored text segments, per-segment-colored glyphs, link to `/account`, correct HTML structure.
- `src/views/privacy.test.ts` — tests that privacy page contains key phrases and does NOT contain `CREATE TABLE`.
- `src/views/account.test.ts` — tests account page contains identity, export link, delete form, and logout link with separator.

**Rationale:** These views currently have zero test coverage. The tests verify the behavioral changes from this change and prevent regressions.

## Risks / Trade-offs

- **[Visual change to identity display]** Users accustomed to multi-colored hash text will see green-only text. → Mitigation: The colored glyphs still provide visual distinction. This is a small community site with low risk of confusion.
- **[Privacy page simplification removes DDL]** Some technical users may have liked seeing the schema. → Mitigation: Source code link remains; the repo is public.
- **[Spec modifications]** Changing the three-color rendering spec affects a foundational capability. → Mitigation: The change is purely cosmetic (text color), not functional. Hash computation and storage are unchanged.
