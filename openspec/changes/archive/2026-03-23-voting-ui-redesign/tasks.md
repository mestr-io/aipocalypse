## 1. CSS Changes

- [x] 1.1 Add `.option-current` class — very light green background (`rgba(0, 204, 0, 0.06)`), no border
- [x] 1.2 Add `.option-selected` class — green border (`#009900`) + light green background (`rgba(0, 204, 0, 0.08)`)
- [x] 1.3 Remove/update `.voted` and `.vote-marker` styles that supported the radio button and gold chevron
- [x] 1.4 Style `.poll-option` as clickable with `cursor: pointer` and `tabindex` support
- [x] 1.5 Add `.vote-submit button:disabled` styles (dimmed, no pointer)

## 2. HTML Template Changes

- [x] 2.1 Remove `<input type="radio">` elements from poll options in `src/views/poll-detail.ts`
- [x] 2.2 Remove gold chevron marker (`▶`) from selected option rendering
- [x] 2.3 Add `data-question-id` attribute to each `.poll-option` div
- [x] 2.4 Add `data-current-vote` attribute to the form element with the user's current vote ID
- [x] 2.5 Add hidden `<input type="hidden" name="questionId">` pre-filled with current vote ID (or empty)
- [x] 2.6 Apply `.option-current` class to the user's voted option on server render
- [x] 2.7 Add `tabindex="0"` and `role="option"` to each clickable `.poll-option` div

## 3. Client-Side JavaScript

- [x] 3.1 Add inline `<script>` block at the bottom of the poll detail template (only when `canVote` is true)
- [x] 3.2 Implement click handler on `.poll-option` divs — updates hidden input, toggles `.option-selected` class
- [x] 3.3 Implement button enable/disable logic — disabled when selected equals current vote, enabled otherwise
- [x] 3.4 Add keyboard support (Enter/Space) on focused `.poll-option` divs
- [x] 3.5 On page load, set button to disabled if user has already voted (JS adds `disabled` attribute)

## 4. Cleanup & Testing

- [x] 4.1 Remove unused radio-button-related CSS rules (`.vote-form .poll-option input[type="radio"]`, label styles)
- [x] 4.2 Verify graceful degradation — form works without JS (hidden input has current vote, button not disabled in HTML)
- [x] 4.3 Test in browser: cast new vote, change vote, click back to current vote (button disables), keyboard navigation
- [x] 4.4 Run `bun test` to verify no regressions
