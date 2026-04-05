## Purpose

Define admin dashboard behavior, poll CRUD query coverage, and admin poll form support for links/context metadata.

## Requirements

### Requirement: Admin dashboard
The application SHALL serve an admin dashboard at `GET /admin` that lists all polls, including soft-deleted ones. Each non-deleted poll title SHALL be a clickable link to the poll's edit form. Soft-deleted polls SHALL be visually distinguished with strikethrough text on the title and a `[deleted]` status badge.

#### Scenario: Dashboard shows all polls including deleted
- **WHEN** an authenticated admin requests `GET /admin`
- **THEN** the server responds with an HTML page listing all polls (including hidden, done, and soft-deleted) with their title, status, question count, and creation date

#### Scenario: Deleted polls have visual distinction
- **WHEN** the dashboard renders a soft-deleted poll
- **THEN** the poll row has strikethrough styling on the title, displays a `[deleted]` status badge, and the title is NOT a clickable edit link

#### Scenario: Non-deleted polls retain edit links
- **WHEN** the dashboard renders a non-deleted poll
- **THEN** the poll title is a clickable link to `/admin/polls/:id/edit`

#### Scenario: Dashboard with no polls
- **WHEN** an authenticated admin requests `GET /admin` and no polls exist (including no deleted polls)
- **THEN** the page displays a message indicating no polls exist and a link to create one

### Requirement: Poll query functions
The application SHALL provide typed query functions in `src/db/queries/polls.ts` for poll and question database operations. All poll query functions that return poll data SHALL include the `links` field (a TEXT column containing markdown-formatted context links, one `[Label](url)` entry per line).

#### Scenario: Insert poll with questions
- **WHEN** `createPoll()` is called with poll data (including a `links` string) and an array of answer strings
- **THEN** a poll row (with the `links` value) and corresponding question rows are inserted inside a transaction, with positions starting at 10 and incrementing by 10, and the new poll ID is returned

#### Scenario: List all polls including deleted
- **WHEN** `listPolls()` is called
- **THEN** all polls (including soft-deleted) are returned ordered by creation date descending, with a count of their non-deleted questions and the `deletedAt` timestamp

#### Scenario: Update poll persists links
- **WHEN** `updatePoll()` is called with updated poll data including a `links` string
- **THEN** the poll's `links` column is updated along with the other fields

#### Scenario: Get poll for edit includes links
- **WHEN** `getPollForEdit(pollId)` is called for an existing poll
- **THEN** the returned poll object includes the `links` field value

### Requirement: Admin poll form links field
The admin poll creation and edit form SHALL include a textarea field for entering context links in markdown format (`[Label](url)`, one per line). The textarea SHALL have a placeholder showing the expected format. When editing an existing poll, the textarea SHALL be pre-populated with the poll's current links value.

#### Scenario: New poll form includes links textarea
- **WHEN** an admin visits `GET /admin/polls/new`
- **THEN** the form includes a textarea labeled "Context Links" with a placeholder showing the `[Label](url)` format

#### Scenario: Edit poll form pre-populates links
- **WHEN** an admin visits `GET /admin/polls/:id/edit` for a poll with existing links
- **THEN** the links textarea is pre-populated with the poll's current links value

#### Scenario: Poll creation with links
- **WHEN** an admin submits the new poll form with links text
- **THEN** the links value is persisted to the poll's `links` column

#### Scenario: Poll update with links
- **WHEN** an admin submits the edit poll form with modified links text
- **THEN** the poll's `links` column is updated with the new value
