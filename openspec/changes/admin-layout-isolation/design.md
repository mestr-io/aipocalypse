## Context

All pages — public and admin — share a single `layout()` function (`src/views/layout.ts`) that renders the full HTML shell: `<nav>` with GitHub auth section, `<main>`, and `<footer>` with privacy link. Admin views call `layout(content, { title })` without passing a `user`, so the nav always shows "Sign in with GitHub (we store minimal data)" — meaningless in the admin context.

The admin panel uses a completely separate auth system (password + HMAC-signed `admin_session` cookie) with no overlap to the GitHub OAuth user system. The two should not share UI chrome.

## Goals / Non-Goals

**Goals:**
- Admin pages render without public auth section (no GitHub login/logout in nav)
- Admin pages render without public footer (no privacy link, no tagline)
- Admin nav shows "AIPocalypse Admin" linking to `/admin`
- Authenticated admin pages show `[logout from admin site]` in the nav bar
- Login page uses admin layout but omits the logout link
- Shared AoC aesthetic (colors, fonts, dark background, CSS file) still applies

**Non-Goals:**
- Security hardening (token expiry, CSRF, rate limiting, timing-safe comparisons) — separate change
- Separate admin CSS file — admin pages continue using the shared `style.css`
- Admin user identity display — there is only one admin, no identity to show

## Decisions

### 1. Separate `adminLayout()` function vs. variant flag on `layout()`

**Decision**: Create a new `adminLayout()` in `src/views/admin-layout.ts`.

**Alternatives considered:**
- Add a `variant: "admin" | "public"` option to `layout()` — rejected because the two layouts share almost nothing beyond HTML boilerplate and the CSS link. Branching inside one function adds complexity for no reuse benefit. The admin layout has no auth section, no footer, and a different nav structure. Separate functions are clearer.

### 2. How `adminLayout()` knows whether to show the logout link

**Decision**: Accept an `authenticated` boolean option.

```typescript
interface AdminLayoutOptions {
  title?: string;
  authenticated?: boolean;  // default false
}
```

The admin view templates already know their auth context — login page passes `false` (or omits it), dashboard and poll-form pass `true`. This is simpler than reading cookies inside the layout function or adding middleware context propagation.

### 3. Admin nav structure

**Decision**: Minimal nav — site title left, logout right.

```
┌──────────────────────────────────────────────────────────┐
│  AIPocalypse Admin                [logout from admin]    │
└──────────────────────────────────────────────────────────┘
```

- "AIPocalypse Admin" links to `/admin` (not `/` — admin stays in admin context)
- `[logout from admin]` links to `/admin/logout`, only rendered when `authenticated: true`
- Login page shows just the title, no right-side links

### 4. Dashboard inline logout removal

**Decision**: Remove the `<p><a href="/admin/logout">Logout</a></p>` from the bottom of the dashboard template. The logout link now lives in the nav and is visible on every authenticated admin page.

### 5. No separate admin CSS

**Decision**: Reuse the existing `.nav-links` class for the admin nav logout link. The existing AoC theme styles (link colors, dimmed text, backgrounds) apply naturally. No new CSS classes needed beyond potentially a small adjustment if the nav title needs differentiation — but "AIPocalypse Admin" as text in the existing `.site-title` class should work.

## Risks / Trade-offs

- **[Duplication of HTML boilerplate]** → `adminLayout()` duplicates the `<!DOCTYPE html>`, `<head>`, CSS link from `layout()`. Acceptable for ~10 lines of shared markup. If a third layout variant ever emerged, we'd extract a `baseShell()` helper — but that's not needed now.
- **[Login page looks sparse]** → The login page with admin layout has no footer and no nav links (just the title). This is intentional — the login page should be clean and focused. The trade-off is a very minimal page, which fits the terminal aesthetic.
- **[`escapeHtml` import]** → `adminLayout()` needs `escapeHtml()` from `layout.ts`. This is already exported and shared by admin view templates, so no new coupling.
