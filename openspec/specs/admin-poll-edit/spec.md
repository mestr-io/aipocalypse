## Purpose

Define admin poll editing workflows, edit-form behavior, and poll update operations.

## Requirements

### Requirement: Poll edit form
The application SHALL serve a poll edit form at `GET /admin/polls/:id/edit` pre-populated with the existing poll data and its answer options.

#### Scenario: Edit form renders with existing data
- **WHEN** an authenticated admin requests `GET /admin/polls/:id/edit`
- **THEN** the server responds with the poll form pre-filled with the poll's current title, body, due date, status, and all existing answer options in position order

#### Scenario: Edit form for non-existent poll
- **WHEN** an authenticated admin requests `GET /admin/polls/:id/edit` for a poll that does not exist or is soft-deleted
- **THEN** the server responds with 404

### Requirement: Poll update handler
The application SHALL accept poll update submissions at `POST /admin/polls/:id` and update the poll and its answer options in a single database transaction.

#### Scenario: Valid poll update
- **WHEN** a POST to `/admin/polls/:id` includes valid title, body, and at least 2 non-empty answer options
- **THEN** the server updates the poll record, replaces the question records (soft-deleting old ones and inserting new ones), and redirects to `GET /admin`

#### Scenario: Missing title on update
- **WHEN** a POST to `/admin/polls/:id` has an empty title
- **THEN** the server responds with 400 and re-renders the edit form with an error message

#### Scenario: Fewer than 2 answers on update
- **WHEN** a POST to `/admin/polls/:id` includes fewer than 2 non-empty answer options
- **THEN** the server responds with 400 and re-renders the edit form with an error message

#### Scenario: Update non-existent poll
- **WHEN** a POST to `/admin/polls/:id` targets a poll that does not exist or is soft-deleted
- **THEN** the server responds with 404

### Requirement: Poll update query function
The application SHALL provide an `updatePoll(pollId, input, answers)` function that updates a poll and replaces its questions in a single transaction.

#### Scenario: Update poll with new questions
- **WHEN** `updatePoll()` is called with a valid poll ID, updated input, and new answer strings
- **THEN** the poll row is updated, existing questions are soft-deleted, new question rows are inserted with positions starting at 10 incrementing by 10, and the operation runs inside a transaction

#### Scenario: Get poll for editing
- **WHEN** `getPollForEdit(pollId)` is called with a valid poll ID
- **THEN** the poll record and all its non-deleted questions ordered by position are returned
