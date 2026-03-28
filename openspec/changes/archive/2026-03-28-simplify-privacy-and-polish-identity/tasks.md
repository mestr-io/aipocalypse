## 1. Identity Rendering

- [x] 1.1 Update `renderIdentity` in `src/views/identity.ts` — change hash text segments to use `color:#009900` instead of `color:#segment`; keep glyph spans using per-segment hex colors
- [x] 1.2 Create `src/views/identity.test.ts` — test that text spans use `color:#009900`, glyph spans use segment hex colors, output wraps in `<a href="/account">`, and structure has correct hyphens

## 2. Privacy Page Simplification

- [x] 2.1 Rewrite `src/views/privacy.ts` — replace verbose DDL-heavy content with minimal prose notice covering: hashed ID storage, no username/avatar/token, session cookie, votes, GDPR rights link to `/account`, source code link
- [x] 2.2 Create `src/views/privacy.test.ts` — test that page contains key phrases ("hashed", "GitHub"), does NOT contain `CREATE TABLE`, contains link to `/account`, contains link to source repo

## 3. Account Page Polish

- [x] 3.1 Update `src/views/account.ts` — wrap logout link in a section with `section-heading` class (top border + margin) to visually separate it from the delete-account area
- [x] 3.2 Create `src/views/account.test.ts` — test that page contains identity rendering, export link, delete form, logout link, and the separator element

## 4. CSS Updates

- [x] 4.1 Add `.identity` text color rule to `src/public/style.css` if needed for hover consistency on the green-text identity segments

## 5. Documentation Updates

- [x] 5.1 Review and update `docs/architecture.md` if privacy page description needs adjustment
- [x] 5.2 Review `docs/models.md` for any references to the privacy page DDL display and update if needed

## 6. Verification

- [x] 6.1 Run `bun test` and verify all new and existing tests pass
- [x] 6.2 Start dev server (`bun run dev`) and manually verify: privacy page has no DDL, identity shows green text with colored glyphs, account page logout is visually separated
