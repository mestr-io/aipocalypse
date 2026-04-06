## Why

Users report the website is not usable on mobile devices. The current CSS has only a minimal responsive breakpoint (nav stacking and padding adjustment at 768px) and interactive elements like poll cards and navigation links have small touch targets that are difficult to tap on phones. This needs fixing to make the site accessible to the significant portion of users browsing on mobile.

## What Changes

- Expand the existing `@media (max-width: 768px)` responsive rules to properly handle all page components on small screens (nav, poll cards, poll detail, footer, forms).
- Make poll card links cover the entire card area so tapping anywhere on the card navigates to the poll, improving touch target size.
- Increase touch target sizes for interactive elements (nav links, poll options, buttons, footer links) to meet the 44px minimum recommended by WCAG.
- Fix layout overflow issues on narrow screens (poll meta flex wrapping, login notice text, progress bars).
- Preserve the existing terminal/AoC visual aesthetic — no visual redesign, only layout and sizing adjustments.

## Capabilities

### New Capabilities
- `mobile-layout`: Responsive layout fixes for all page components — nav, poll cards, poll detail, forms, and footer on small screens.
- `touch-targets`: Enlarged interactive areas for links, buttons, and poll cards to meet mobile usability standards.

### Modified Capabilities

## Impact

- `src/public/style.css` — primary file affected; new/expanded media queries and touch target styles.
- `src/views/poll-list.ts` — poll card HTML may need wrapping links or structural changes to make entire cards clickable.
- `src/views/poll-detail.ts` — poll option touch targets may need padding/sizing adjustments.
- `src/views/layout.ts` — nav and footer structure may need minor HTML tweaks for mobile layout.
- No database, API, or dependency changes.
