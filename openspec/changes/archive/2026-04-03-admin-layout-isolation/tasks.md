## 1. Admin layout function

- [x] 1.1 Create `src/views/admin-layout.ts` with `adminLayout(content, options)` function. Options: `{ title?: string, authenticated?: boolean }`. Renders HTML shell with shared CSS link, nav with "AIPocalypse Admin" linking to `/admin`, conditional `[logout from admin site]` link when `authenticated: true`, no footer. Reuse `escapeHtml` from `layout.ts`.
- [x] 1.2 Add tests in `src/views/admin-layout.test.ts`: unauthenticated renders no logout link, authenticated renders logout link in nav, no footer present, no "Sign in with GitHub" present, no privacy link present, title links to `/admin`.

## 2. Switch admin views to admin layout

- [x] 2.1 Update `src/views/admin/login.ts` to import and use `adminLayout()` with `authenticated: false`. Verify no GitHub auth section or footer in output.
- [x] 2.2 Update `src/views/admin/dashboard.ts` to import and use `adminLayout()` with `authenticated: true`. Remove the inline logout `<p>` at the bottom of the dashboard content.
- [x] 2.3 Update `src/views/admin/poll-form.ts` to import and use `adminLayout()` with `authenticated: true`.

## 3. Update existing tests

- [x] 3.1 Update any existing admin view tests that assert on layout elements (footer, nav auth section, logout link placement) to match the new admin layout output.
- [x] 3.2 Run full test suite (`bun test`) and fix any failures.
