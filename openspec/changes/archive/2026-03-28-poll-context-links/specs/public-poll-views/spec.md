## MODIFIED Requirements

### Requirement: Poll detail page
The application SHALL render a poll detail page at `GET /poll/:id` showing the poll title, full description, context links (if any), due date, and all answer options with vote distribution displayed as AoC-style progress bars. Each option SHALL be rendered as a clickable div (not a radio button). The user's current vote SHALL be indicated by a light green background. No radio buttons or gold chevron markers SHALL be used. If the poll has context links, they SHALL be rendered as a list of clickable `<a>` elements between the poll body and the voting options. Each link SHALL open in a new browser tab (`target="_blank"`) with `rel="noopener noreferrer"`.

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

#### Scenario: Poll detail renders context links
- **WHEN** a browser requests `GET /poll/:id` for a poll that has context links
- **THEN** the page renders a list of clickable links between the poll body and the voting options, each with `target="_blank"` and `rel="noopener noreferrer"`

#### Scenario: Poll detail with no links
- **WHEN** a browser requests `GET /poll/:id` for a poll with an empty links field
- **THEN** no links section is rendered on the page

#### Scenario: Malformed link lines ignored
- **WHEN** the links field contains lines that do not match the `[Label](url)` format
- **THEN** those lines are silently ignored and only valid `[Label](url)` entries are rendered

### Requirement: Poll with questions and votes query function
The application SHALL provide a `getPollWithQuestions(pollId)` function that returns a single poll with its questions, per-question vote counts, and context links.

#### Scenario: Get poll with vote distribution
- **WHEN** `getPollWithQuestions(pollId)` is called with a valid poll ID
- **THEN** the poll record is returned along with all non-deleted questions ordered by `position` ascending, each including a `voteCount` field, and the poll's `links` field

#### Scenario: Poll not found
- **WHEN** `getPollWithQuestions(pollId)` is called with a non-existent or soft-deleted poll ID
- **THEN** the function returns `null`
