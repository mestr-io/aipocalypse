## Context

The admin dashboard (`GET /admin`) currently calls `listPolls()` which filters out soft-deleted polls (`WHERE p.deletedAt IS NULL`). Admins have no way to see or recover deleted polls. Additionally, the dimmed color `#333340` used across both admin and public pages is nearly invisible against the `#0f0f23` background — dates, the logout link, and other secondary text are hard to read.

## Goals / Non-Goals

**Goals:**
- Show soft-deleted polls in the admin dashboard with clear visual distinction
- Improve readability of secondary/dimmed text on admin pages (pastel yellow)
- Improve readability of secondary/dimmed text on public pages (pastel green)

**Non-Goals:**
- Undelete/restore functionality — out of scope, this is view-only
- Changing the dimmed color of borders, separators, or structural elements — only text color changes
- Editing deleted polls — the edit link is removed for deleted rows

## Decisions

### 1. Split dimmed colors by context (admin vs public)

**Decision**: Introduce `.admin-dimmed` class with pastel yellow `#c8b87a` for admin templates. Change the existing `.dimmed` class from `#333340` to pastel green `#5e8c61` for public pages.

**Rationale**: Admin pages are functional/utilitarian — a warm yellow stands out against the dark background and clearly separates admin from the public AoC theme. Public pages stay in the green family to match the terminal aesthetic. Using separate classes avoids coupling the two contexts.

**Alternative considered**: A single shared dimmed color (e.g., `#888888`). Rejected because it blurs the visual boundary between admin and public contexts.

### 2. Include deleted polls via query change

**Decision**: Modify `listPolls()` to remove the `p.deletedAt IS NULL` filter, adding `p.deletedAt` to the SELECT list. The dashboard template checks `deletedAt` to render a `[deleted]` status badge and strikethrough styling.

**Rationale**: Simplest approach — one query change, one template change. The `PollRow` type gains an optional `deletedAt` field. Deleted rows sort naturally by `createdAt DESC` alongside active polls.

**Alternative considered**: Separate `listDeletedPolls()` function with a dedicated section. Rejected — over-engineering for a simple admin view.

### 3. Deleted poll row styling

**Decision**: Deleted polls get a `deleted-row` CSS class on the `<tr>` element. The title has strikethrough text (`text-decoration: line-through`), the status badge shows `[deleted]` in a muted red, and the edit link is removed (plain text title instead).

**Rationale**: Strikethrough is a universal "removed" visual indicator. Removing the edit link prevents confusion — editing a deleted poll makes no sense without undelete.

## Risks / Trade-offs

- **Risk**: Pastel colors may not look right on all monitors. **Mitigation**: Both chosen colors (`#c8b87a`, `#5e8c61`) have sufficient contrast ratio against `#0f0f23` (>4.5:1 WCAG AA).
- **Risk**: Showing deleted polls clutters the admin dashboard. **Mitigation**: Deleted rows are visually subdued with strikethrough and muted styling. This is a net positive for admin visibility.
- **Trade-off**: Admin templates now use `.admin-dimmed` instead of `.dimmed`, requiring edits to all admin view files. The change is mechanical and small.
