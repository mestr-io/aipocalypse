## Context

The site uses a single `style.css` with a monospace terminal aesthetic (dark background, green-on-black). There is one `@media (max-width: 768px)` block that only adjusts container padding, nav direction, and h1 size. The viewport meta tag is already set correctly. Poll cards contain links only in the `<h2>` — the rest of the card is dead space on touch. Interactive elements (nav links, poll options, buttons) use default sizing that falls below the 44px WCAG minimum for touch targets.

HTML templates are server-rendered TypeScript template literals in `src/views/`. There is no client-side framework. The existing inline script for vote selection uses click/keydown handlers on `.poll-option[data-question-id]` elements.

## Goals / Non-Goals

**Goals:**
- Make all pages usable on mobile viewports (320px-768px) without horizontal scroll.
- Ensure all interactive elements meet minimum 44px touch target size.
- Make entire poll cards clickable (link covers the card), not just the title text.
- Preserve the terminal/AoC aesthetic — same colors, fonts, spacing feel.

**Non-Goals:**
- No visual redesign — no new colors, fonts, or layout paradigms.
- No client-side JavaScript additions beyond what exists.
- No PWA, app manifest, or mobile-specific features.
- No changes to the admin panel (low priority, password-protected).

## Decisions

### 1. CSS-only approach for clickable poll cards
**Decision**: Use a CSS technique where the `<a>` inside `.poll-card h2` is stretched to cover the entire card using `position: absolute` + `::after` pseudo-element, with the card set to `position: relative`.

**Why over alternatives**:
- Wrapping entire card in `<a>` changes semantic structure and could break nested elements.
- JavaScript click handler adds complexity for a pure presentational concern.
- The `::after` stretch technique is well-supported, preserves HTML structure, and keeps nested text selectable.

### 2. Expand existing media query rather than add new breakpoints
**Decision**: Enhance the existing `@media (max-width: 768px)` block with all needed mobile rules. No additional breakpoints.

**Why**: The site is text-heavy monospace — there's no complex grid that needs multiple breakpoints. A single mobile breakpoint keeps the CSS simple and the content reflows naturally with the existing flex/block layout.

### 3. Touch targets via padding, not min-height
**Decision**: Increase touch target sizes by adding padding to interactive elements (nav links, poll options, footer links) rather than setting explicit min-height/min-width.

**Why**: Padding preserves the natural flow and spacing of the terminal aesthetic. Explicit dimensions could create awkward gaps or break the monospace grid feel.

### 4. Flex-wrap for poll-meta and nav-links
**Decision**: Add `flex-wrap: wrap` to `.poll-meta` and `.nav-links` in the mobile breakpoint to prevent horizontal overflow.

**Why**: These containers use `display: flex` with `gap` — on narrow screens the items overflow. Wrapping is the simplest fix that preserves the layout.

### 5. Hide verbose login notice on mobile
**Decision**: Hide the `.login-notice` span on mobile via `display: none`. The sign-in link itself remains visible.

**Why**: The parenthetical "(stores a hashed identity, votes, and session data — details)" is too long for mobile nav and is supplementary information available on the privacy page.

## Risks / Trade-offs

- **[Risk] Poll card clickable area may interfere with text selection** → Mitigation: The `::after` overlay approach allows text in `.poll-preview` and `.poll-meta` to remain selectable since those elements can be given `position: relative; z-index: 1` if needed.
- **[Risk] Existing vote selection script relies on click events on `.poll-option`** → Mitigation: No changes to poll-detail option structure; touch target improvements use padding only, which doesn't affect the JS event delegation.
- **[Trade-off] Single breakpoint means tablets get mobile layout below 768px** → Acceptable for this text-heavy monospace site. The desktop layout works fine on most tablets in landscape.
