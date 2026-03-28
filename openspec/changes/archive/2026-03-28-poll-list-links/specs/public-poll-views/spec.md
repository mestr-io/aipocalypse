## MODIFIED Requirements

### Requirement: Active poll list on home page
The application SHALL display a list of all active polls on the home page (`GET /`). Each poll entry SHALL show the poll title, a preview of the description, context links (if any), the due date, and the total number of votes cast. If a poll has context links, they SHALL be rendered as a list of clickable `<a>` elements between the body preview and the meta row, each opening in a new tab (`target="_blank"`) with `rel="noopener noreferrer"`.

#### Scenario: Home page with active polls
- **WHEN** a browser requests `GET /` and active polls exist
- **THEN** the server responds with an HTML page listing each active poll with its title (as a link to the poll detail), description preview (first 120 characters), due date, and total vote count

#### Scenario: Home page with no active polls
- **WHEN** a browser requests `GET /` and no active polls exist
- **THEN** the page displays a message indicating no polls are currently active

#### Scenario: Hidden and done polls are excluded
- **WHEN** a browser requests `GET /` and polls with status `hidden` or `done` exist
- **THEN** those polls are NOT included in the list

#### Scenario: Poll card renders context links
- **WHEN** a poll card is rendered for a poll that has context links
- **THEN** the card displays the links as a `<ul>` list between the body preview and the meta row, with each link opening in a new tab

#### Scenario: Poll card with no links
- **WHEN** a poll card is rendered for a poll with an empty links field
- **THEN** no links section is rendered on the card

#### Scenario: Poll card with malformed links
- **WHEN** a poll's links field contains lines that do not match the `[Label](url)` format
- **THEN** those lines are silently ignored and only valid entries are rendered

### Requirement: Active polls query function
The application SHALL provide a `listActivePolls()` function that returns all active polls with their total vote counts and context links.

#### Scenario: List active polls with vote counts
- **WHEN** `listActivePolls()` is called
- **THEN** all non-deleted polls with status `active` are returned ordered by creation date descending, each including a `voteCount` field and the poll's `links` field
