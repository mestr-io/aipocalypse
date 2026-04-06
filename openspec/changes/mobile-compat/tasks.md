## 1. Mobile Layout — CSS Responsive Fixes

- [x] 1.1 Expand the `@media (max-width: 768px)` block in `src/public/style.css` to add `flex-wrap: wrap` on `.nav-links` and `.poll-meta`, and hide `.login-notice` with `display: none`
- [x] 1.2 Add mobile rules for poll cards: reduce padding, ensure text wraps, and prevent overflow on `.poll-card`, `.poll-preview`, `.poll-body`
- [x] 1.3 Add mobile rules for poll detail: ensure `.option-label`, `.option-bar`, and `.progress-bar` elements stay within viewport width and wrap naturally
- [x] 1.4 Add mobile rules for footer: increase padding for touch target sizing and ensure footer text wraps

## 2. Clickable Poll Cards

- [x] 2.1 In `src/public/style.css`, add `position: relative` to `.poll-card` and a `.poll-card h2 a::after` pseudo-element with `position: absolute; inset: 0` to stretch the link across the full card area
- [x] 2.2 Verify that nested elements (`.poll-preview`, `.poll-meta`) remain selectable by adding `position: relative; z-index: 1` where needed if text selection is broken

## 3. Touch Target Sizing

- [x] 3.1 In the mobile media query, add padding to `.nav-links a` and `.site-title` to achieve at least 44px touch target height
- [x] 3.2 Add padding to `.poll-option` to ensure at least 44px tap area height on all viewports
- [x] 3.3 Add padding to `footer a` and `footer` to ensure at least 44px touch target for footer links on mobile
- [x] 3.4 Add minimum padding to `button` and `.btn` to ensure at least 44px touch target on mobile

## 4. Verification

- [ ] 4.1 Run `bun test` to confirm no existing tests are broken
- [ ] 4.2 Use DevTools to test the home page at 375px viewport width — verify no horizontal scroll, nav stacking, card clickability, and touch target sizes
- [ ] 4.3 Use DevTools to test a poll detail page at 375px viewport — verify poll options, progress bars, and vote form are usable
- [ ] 4.4 Verify at 320px viewport width that the narrowest common mobile width renders correctly
