## Requirements

### Requirement: Active poll list on home page
The application SHALL display a list of all active polls on the home page (`GET /`). Each poll entry SHALL show the poll title, a preview of the description, the due date, and the total number of votes cast. For authenticated users, each poll card SHALL also display a `[voted]` badge if the user has previously voted on that poll. Context links SHALL NOT be rendered on poll list cards — they are shown only on the poll detail page.

#### Scenario: Home page with active polls
- **WHEN** a browser requests `GET /` and active polls exist
- **THEN** the server responds with an HTML page listing each active poll with its title (as a link to the poll detail), description preview (first 120 characters), due date, and total vote count

#### Scenario: Home page with no active polls
- **WHEN** a browser requests `GET /` and no active polls exist
- **THEN** the page displays a message indicating no polls are currently active

#### Scenario: Hidden and done polls are excluded
- **WHEN** a browser requests `GET /` and polls with status `hidden` or `done` exist
- **THEN** those polls are NOT included in the list

#### Scenario: Poll card does not render context links
- **WHEN** a poll card is rendered for a poll that has context links
- **THEN** the card SHALL NOT display any links section; links are only shown on the poll detail page

#### Scenario: Voted badge shown for authenticated user
- **WHEN** an authenticated user views the home page and has voted on a poll
- **THEN** the poll card for that poll SHALL display a `<span class="voted-badge">[voted]</span>` on the meta row in dimmed green (`#5e8c61`)

#### Scenario: No voted badge for unauthenticated user
- **WHEN** an unauthenticated user views the home page
- **THEN** no voted badges are displayed on any poll cards

#### Scenario: No voted badge for polls user has not voted on
- **WHEN** an authenticated user views the home page and has NOT voted on a particular poll
- **THEN** that poll card SHALL NOT display a voted badge

### Requirement: Poll detail page
The application SHALL render a poll detail page at `GET /poll/:id` showing the poll title, full description, due date, and all answer options with vote distribution displayed as AoC-style progress bars. Each option SHALL be rendered as a clickable div (not a radio button). The user's current vote SHALL be indicated by a light green background. No radio buttons or gold chevron markers SHALL be used. If the poll has context links, they SHALL be rendered as a "Related info:" labeled list of clickable `<a>` elements below the total vote count and above the "Back to predictions" link. Each link SHALL open in a new browser tab (`target="_blank"`) with `rel="noopener noreferrer"`). Links SHALL use dimmed green (`#5e8c61`) by default, brightening to `#00cc00` on hover.

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

#### Scenario: Poll detail renders context links below vote total
- **WHEN** a browser requests `GET /poll/:id` for a poll that has context links
- **THEN** the page renders a "Related info:" label followed by a list of clickable links below the total vote count and above the "Back to predictions" link, each with `target="_blank"` and `rel="noopener noreferrer"`, styled in dimmed green (`#5e8c61`) with `#00cc00` on hover

#### Scenario: Poll detail with no links
- **WHEN** a browser requests `GET /poll/:id` for a poll with an empty links field
- **THEN** no links section is rendered on the page

#### Scenario: Malformed link lines ignored
- **WHEN** the links field contains lines that do not match the `[Label](url)` format
- **THEN** those lines are silently ignored and only valid `[Label](url)` entries are rendered

### Requirement: Active polls query function
The application SHALL provide a `listActivePolls()` function that returns all active polls with their total vote counts and context links.

#### Scenario: List active polls with vote counts
- **WHEN** `listActivePolls()` is called
- **THEN** all non-deleted polls with status `active` are returned ordered by creation date descending, each including a `voteCount` field and the poll's `links` field

### Requirement: Poll with questions and votes query function
The application SHALL provide a `getPollWithQuestions(pollId)` function that returns a single poll with its questions, per-question vote counts, and context links.

#### Scenario: Get poll with vote distribution
- **WHEN** `getPollWithQuestions(pollId)` is called with a valid poll ID
- **THEN** the poll record is returned along with all non-deleted questions ordered by `position` ascending, each including a `voteCount` field, and the poll's `links` field

#### Scenario: Poll not found
- **WHEN** `getPollWithQuestions(pollId)` is called with a non-existent or soft-deleted poll ID
- **THEN** the function returns `null`

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

### Requirement: Bulk voted polls query
The application SHALL provide a `getUserVotedPollIds(userId: number)` function in `src/db/queries/votes.ts` that returns an array of poll IDs the user has voted on.

#### Scenario: User with votes
- **WHEN** `getUserVotedPollIds(userId)` is called for a user who has voted on 3 polls
- **THEN** the function returns an array containing those 3 poll IDs

#### Scenario: User with no votes
- **WHEN** `getUserVotedPollIds(userId)` is called for a user who has not voted on any polls
- **THEN** the function returns an empty array

#### Scenario: Only active polls included
- **WHEN** `getUserVotedPollIds(userId)` is called and the user has voted on a soft-deleted poll
- **THEN** the deleted poll's ID is still included (votes are preserved; filtering is the view's concern)
