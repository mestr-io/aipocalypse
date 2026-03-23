## Context

The poll detail page currently uses native `<input type="radio">` elements and a gold chevron (`▶`) to indicate the user's current vote. The form always wraps all options, and the submit button is always enabled. This works but feels disconnected from the AoC terminal aesthetic — radios look out of place and the chevron is easy to miss.

The project uses server-side rendered HTML with no client-side framework. Any interactivity must be vanilla JS, kept minimal, and degrade gracefully.

## Goals / Non-Goals

**Goals:**
- Replace radio buttons with clickable option divs that feel native to the terminal aesthetic
- Show the user's existing vote with a subtle light green background (no border) on page load
- When user clicks a different option, highlight it with green border + light green background
- Disable the submit button until the user selects a different option than their current vote
- Keep the form POST mechanism unchanged — still submits `questionId` to `/vote/:pollId`

**Non-Goals:**
- No changes to the voting backend or API
- No changes to anonymous/logged-out view (still shows results without interactivity)
- No changes to the poll list page
- No AJAX/fetch-based voting — keep the full-page form POST

## Decisions

### 1. Hidden input instead of radio buttons

**Choice:** Replace visible radio buttons with a single `<input type="hidden" name="questionId">` whose value is set by JS on option click.

**Rationale:** Radio buttons can't be fully styled to match the terminal aesthetic. A hidden input gives complete control over the visual presentation while keeping the form submission identical. The server sees the same POST body.

**Alternative considered:** Styling radio buttons with CSS `appearance: none` — still requires complex pseudo-element hacks and doesn't eliminate the radio mental model.

### 2. Inline `<script>` block (not separate JS file)

**Choice:** Add a small `<script>` at the bottom of the poll detail template, inlined in the HTML.

**Rationale:** This is a single-page interaction (~30 lines of JS). A separate file adds an HTTP request and cache management for minimal code. The project convention is "no client-side JS unless strictly necessary for form interactions" — this qualifies, and inlining keeps it contained.

**Alternative considered:** Separate `/public/vote.js` — overkill for the amount of code, adds a network request.

### 3. CSS classes for selection states

**Choice:** Two distinct CSS classes:
- `.option-current` — applied on page load to the user's existing vote (light green background, no border)
- `.option-selected` — applied via JS when user clicks a different option (green border + light green background)

When user clicks a new option, `.option-selected` is added to the clicked option and removed from all others. The `.option-current` class remains on the original vote for reference but is visually overridden by `.option-selected` if both apply.

**Rationale:** Separating "server-rendered current state" from "client-side pending selection" makes the logic clear and avoids flash-of-wrong-state issues.

### 4. Data attributes for JS targeting

**Choice:** Use `data-question-id` on each option div and `data-current-vote` on the form element.

**Rationale:** Clean separation between presentation and behavior. JS reads these attributes instead of parsing DOM structure.

### 5. Graceful degradation

**Choice:** If JS is disabled, the form still works — the hidden input will have the current vote's value pre-filled, and the button won't be disabled (no `disabled` attribute in HTML, JS adds it on load).

**Rationale:** Matches the project's server-first philosophy. The form degrades to "click submit to re-confirm your vote" which is harmless.

## Risks / Trade-offs

- **[No keyboard accessibility for option selection]** → Mitigate by adding `tabindex="0"` and `keydown` handler for Enter/Space on option divs. This keeps keyboard navigation working without radio buttons.
- **[JS disabled = button always enabled]** → Acceptable trade-off. Re-submitting the same vote is a no-op (upsert). Users without JS get a slightly degraded but functional experience.
- **[Click target is the entire option div]** → Good for usability (large click target) but need to ensure the progress bar area below the label is also part of the clickable region. Entire `.poll-option` div gets the click handler.
