## MODIFIED Requirements

### Requirement: Poll detail page
The application SHALL render a poll detail page at `GET /poll/:id` showing the poll title, full description, due date, and all answer options with vote distribution displayed as AoC-style progress bars. Each option SHALL be rendered as a clickable div (not a radio button). The user's current vote SHALL be indicated by a light green background. No radio buttons or gold chevron markers SHALL be used.

#### Scenario: Poll detail renders with vote bars
- **WHEN** a browser requests `GET /poll/:id` for an active poll
- **THEN** the server responds with an HTML page showing the poll title, full body text, due date, and each answer option as a clickable div with an AoC-style `[**** ]` progress bar showing the vote percentage and the percentage number

#### Scenario: Poll detail shows total vote count
- **WHEN** a non-authenticated user views a poll detail page
- **THEN** the page displays the total number of votes (e.g., "42 votes") but does NOT show any individual voter identities

#### Scenario: Poll not found
- **WHEN** a browser requests `GET /poll/:id` with an ID that does not exist or belongs to a soft-deleted poll
- **THEN** the server responds with 404

#### Scenario: Hidden poll not accessible
- **WHEN** a browser requests `GET /poll/:id` for a poll with status `hidden`
- **THEN** the server responds with 404

#### Scenario: Options ordered by position
- **WHEN** a poll detail page is rendered
- **THEN** the answer options are displayed in ascending `position` order

#### Scenario: Zero votes display
- **WHEN** a poll has no votes
- **THEN** all progress bars show 0% and the total vote count shows "0 votes"

#### Scenario: Authenticated user sees current vote highlighted
- **WHEN** an authenticated user who has voted views a poll detail page
- **THEN** the option they voted for SHALL have a light green background (CSS class `option-current`) and NO border, NO radio button, and NO gold chevron marker

#### Scenario: Authenticated user selects a different option
- **WHEN** an authenticated user clicks on an option different from their current vote
- **THEN** the clicked option SHALL receive a green border and light green background (CSS class `option-selected`), the previously selected option SHALL lose the `option-selected` class, and a hidden form input SHALL be updated with the clicked option's question ID

#### Scenario: Submit button disabled until vote changes
- **WHEN** an authenticated user views a poll they have already voted on
- **THEN** the "Change Vote" button SHALL be disabled (HTML `disabled` attribute) until the user selects a different option than their current vote

#### Scenario: Submit button enabled for new voter
- **WHEN** an authenticated user who has NOT voted views an active poll
- **THEN** the "Cast Vote" button SHALL be disabled until the user selects any option

#### Scenario: Clicking current vote deselects pending change
- **WHEN** an authenticated user has selected a different option and then clicks back on their current vote
- **THEN** the `option-selected` class SHALL be removed from all options, the hidden input SHALL revert to the current vote's question ID, and the submit button SHALL become disabled again

#### Scenario: Graceful degradation without JavaScript
- **WHEN** an authenticated user views a poll with JavaScript disabled
- **THEN** the form SHALL still function — the hidden input contains the current vote's question ID, and the submit button is NOT disabled (JS adds the `disabled` attribute on page load)

## ADDED Requirements

### Requirement: Client-side vote selection interaction
The poll detail page SHALL include an inline `<script>` block that handles option selection via click events on option divs. The script SHALL manage a hidden `<input name="questionId">` field, toggle CSS classes (`option-selected`) on option divs, and enable/disable the submit button based on whether the selected option differs from the user's current vote. The script SHALL also support keyboard interaction (Enter/Space) on focused option divs via `tabindex="0"`.

#### Scenario: Click on option div updates hidden input
- **WHEN** user clicks on a `.poll-option` div with `data-question-id` attribute
- **THEN** the hidden input's value SHALL be set to that option's `data-question-id`

#### Scenario: Keyboard activation of option
- **WHEN** user focuses a `.poll-option` div and presses Enter or Space
- **THEN** the option SHALL be selected as if it were clicked

#### Scenario: Only one option selected at a time
- **WHEN** user clicks on an option
- **THEN** the `option-selected` class SHALL be removed from all other options and added only to the clicked option
