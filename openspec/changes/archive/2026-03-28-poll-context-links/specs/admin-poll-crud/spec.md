## MODIFIED Requirements

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

## ADDED Requirements

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
