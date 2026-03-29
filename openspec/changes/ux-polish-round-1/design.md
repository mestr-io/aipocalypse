## Context

AIPocalypse is a server-side rendered poll site with an AoC terminal aesthetic (dark `#0f0f23` background, green links, monospace font). After shipping poll context links and list-level link display, several UX rough edges remain: links clutter poll cards, link colors compete with interactive elements, users lack at-a-glance voted state, the account deletion uses a jarring browser `confirm()`, and account sections lack breathing room.

The site uses no client-side framework — all HTML is server-rendered via template literals in `src/views/`. Minimal inline `<script>` blocks handle interactive behaviors (e.g., vote selection on poll detail). CSS lives in a single `src/public/style.css` file (~510 lines).

## Goals / Non-Goals

**Goals:**
- Remove visual clutter from poll list cards by dropping inline links (keep them on detail only)
- Establish a dimmed link style for contextual/reference links vs. interactive links
- Give logged-in users immediate visibility into which polls they've already voted on
- Replace the browser-native `confirm()` with an inline CSS-only slide-reveal pattern for account deletion
- Improve vertical rhythm on the account page

**Non-Goals:**
- No new database tables or migrations
- No client-side framework or build step
- No changes to poll creation, admin, or API routes
- No changes to the vote-casting flow itself
- No changes to the hash identity header or auth flows

## Decisions

### 1. Voted badge: server-side bulk query approach

**Decision**: Add `getUserVotedPollIds(userId: number): number[]` to `src/db/queries/votes.ts`. The home route handler calls this once per request (for authenticated users only), producing a `Set<number>` of poll IDs. This set is passed to `pollListPage()` which passes it down to `renderCard()`.

**Why not per-card queries**: The current `getUserVote(userId, pollId)` would require N queries for N polls. A single `SELECT DISTINCT pollId FROM votes WHERE userId = ?` is simpler and more efficient.

**Why not a JOIN in listPublicPolls**: Keeps the public listing query auth-agnostic. The vote lookup is a separate concern — easier to test independently and avoids complicating the poll list query with optional user context.

**Badge rendering**: `renderCard()` gains an optional `voted?: boolean` parameter. When true, it renders a `<span class="voted-badge">` containing `[voted]` in dimmed green (`#5e8c61`), placed on the meta row next to the vote count.

### 2. Link style: dimmed green for reference links

**Decision**: `.poll-links a` uses `#5e8c61` (the existing dimmed/pastel green) by default, with `#00cc00` on hover. This distinguishes informational reference links from primary navigation links (`#009900`/`#00cc00`).

**Alternative considered**: Using `#666` grey — rejected because it breaks the green monochrome palette entirely.

### 3. Delete confirmation: CSS-only checkbox slide-reveal

**Decision**: Replace the `onsubmit="return confirm(...)"` with a hidden-checkbox + CSS `overflow: hidden` / `transform: translateX` pattern. The outer container has `overflow: hidden`. A checkbox input is visually hidden. The "Delete my account" label toggles the checkbox, which shifts the inner container left to reveal confirmation buttons.

Structure:
```
.delete-slide            (overflow: hidden, fixed width)
  input#delete-toggle    (hidden checkbox)
  .delete-slide-track    (flex row, translateX controlled by :checked)
    label[for=delete-toggle] "Delete my account"   (initial state)
    .delete-confirm
      label[for=delete-toggle] "No... keep my account"  (unchecks → slides back)
      button[type=submit] "Yes, delete my account"      (submits form)
```

**Why CSS-only vs. inline JS**: The site already avoids client-side JS where possible. A checkbox toggle with CSS `:checked` sibling selector achieves the animation without any script. Graceful degradation: if CSS fails, the form still has a submit button visible.

**Why not a modal**: Modals require JS for focus trapping and backdrop handling. The inline slide-reveal is simpler and more aligned with the terminal aesthetic.

### 4. Account section spacing

**Decision**: Add `margin-top: 2rem` to `.section-heading` elements on the account page. This is the simplest approach — the `.section-heading` class already exists on the export, delete, and logout headings. A single CSS rule increases spacing between all account sections uniformly.

### 5. Removing links from poll list cards

**Decision**: Remove the `renderLinks()` import and call from `src/views/poll-list.ts`. Also remove `links` from the `renderCard()` function parameters since it's no longer used there. The `ActivePollRow` type retains `links` (it's still used by admin views), but the public card renderer no longer references it.

## Risks / Trade-offs

**[CSS :checked browser support]** The `:checked` sibling selector pattern is supported in all modern browsers and IE9+. No real risk.

**[Slide animation jank on slow devices]** Using `transform: translateX` is GPU-accelerated. Minimal risk, and the animation is simple (single axis translate).

**[Extra query per home page load for logged-in users]** `getUserVotedPollIds` runs one additional SELECT per authenticated home page request. With SQLite and a small user base, this is negligible. If it ever matters, an index on `votes(userId)` already exists from the foreign key.

**[No JS fallback for slide-reveal]** If CSS fails entirely, the user sees both the "Delete" label and the confirmation buttons simultaneously. The form still works — submitting "Yes, delete" still POSTs. This is acceptable graceful degradation.
