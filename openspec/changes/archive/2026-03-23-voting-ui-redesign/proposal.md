## Why

The current voting UI uses native radio buttons and a gold chevron marker, which feel disconnected from the AoC terminal aesthetic. Clicking targets are small (radio + label text only), and the "Change Vote" button is always active even when no change has been made, leading to unnecessary form submissions.

## What Changes

- Remove radio buttons and gold chevron (`▶`) marker from voting options
- Make the entire option `div` clickable to select a vote
- Show the user's current vote with a very light green background (no border)
- When a different option is clicked, add a green border + light green background to the newly selected option
- "Change Vote" / "Cast Vote" button starts disabled and only activates when the user selects a different option than their current vote
- Add minimal client-side JavaScript to handle option selection and button state (no frameworks)

## Capabilities

### New Capabilities

_None — this change modifies existing voting behavior._

### Modified Capabilities

- `public-poll-views`: Voting interaction model changes from radio buttons to clickable divs with visual selection state, and submit button becomes conditionally enabled.

## Impact

- `src/views/poll-detail.ts` — HTML structure changes: remove `<input type="radio">`, remove `▶` marker, add click targets on option divs, add `data-` attributes for JS, button gets `disabled` attribute
- `src/public/style.css` — New classes for selected state (`.option-selected`), current vote state (`.option-current`), remove radio/chevron styles
- New inline `<script>` block or small JS file for option click handling and button enable/disable logic
- No backend changes — the form still POSTs `questionId` to `/vote/:pollId`
