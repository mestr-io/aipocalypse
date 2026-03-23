## Requirements

### Requirement: Active poll list on home page
The application SHALL display a list of all active polls on the home page (`GET /`). Each poll entry SHALL show the poll title, a preview of the description, the due date, and the total number of votes cast.

#### Scenario: Home page with active polls
- **WHEN** a browser requests `GET /` and active polls exist
- **THEN** the server responds with an HTML page listing each active poll with its title (as a link to the poll detail), description preview (first 120 characters), due date, and total vote count

#### Scenario: Home page with no active polls
- **WHEN** a browser requests `GET /` and no active polls exist
- **THEN** the page displays a message indicating no polls are currently active

#### Scenario: Hidden and done polls are excluded
- **WHEN** a browser requests `GET /` and polls with status `hidden` or `done` exist
- **THEN** those polls are NOT included in the list

### Requirement: Poll detail page
The application SHALL render a poll detail page at `GET /poll/:id` showing the poll title, full description, due date, and all answer options with vote distribution displayed as AoC-style progress bars.

#### Scenario: Poll detail renders with vote bars
- **WHEN** a browser requests `GET /poll/:id` for an active poll
- **THEN** the server responds with an HTML page showing the poll title, full body text, due date, and each answer option with an AoC-style `[**** ]` progress bar showing the vote percentage and the percentage number

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

### Requirement: Active polls query function
The application SHALL provide a `listActivePolls()` function that returns all active polls with their total vote counts.

#### Scenario: List active polls with vote counts
- **WHEN** `listActivePolls()` is called
- **THEN** all non-deleted polls with status `active` are returned ordered by creation date descending, each including a `voteCount` field with the total number of non-deleted answers

### Requirement: Poll with questions and votes query function
The application SHALL provide a `getPollWithQuestions(pollId)` function that returns a single poll with its questions and per-question vote counts.

#### Scenario: Get poll with vote distribution
- **WHEN** `getPollWithQuestions(pollId)` is called with a valid poll ID
- **THEN** the poll record is returned along with all non-deleted questions ordered by `position` ascending, each including a `voteCount` field

#### Scenario: Poll not found
- **WHEN** `getPollWithQuestions(pollId)` is called with a non-existent or soft-deleted poll ID
- **THEN** the function returns `null`
