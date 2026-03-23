## MODIFIED Requirements

### Requirement: Admin dashboard
The application SHALL serve an admin dashboard at `GET /admin` that lists all polls. Each poll title SHALL be a clickable link to the poll's edit form.

#### Scenario: Dashboard shows all polls
- **WHEN** an authenticated admin requests `GET /admin`
- **THEN** the server responds with an HTML page listing all polls (including hidden/draft) with their title as a link to `/admin/polls/:id/edit`, status, question count, and creation date

#### Scenario: Dashboard with no polls
- **WHEN** an authenticated admin requests `GET /admin` and no polls exist
- **THEN** the page displays a message indicating no polls exist and a link to create one

### Requirement: Poll creation handler
The application SHALL accept poll creation submissions at `POST /admin/polls` and insert the poll and all answer options in a single database transaction.

#### Scenario: Valid poll submission
- **WHEN** a POST to `/admin/polls` includes a title, body, at least 2 non-empty answer options, and a valid status
- **THEN** the server creates a poll record and question records in a single transaction, assigns UUID v7 IDs, and redirects to `GET /admin`

#### Scenario: Missing title
- **WHEN** a POST to `/admin/polls` has an empty title
- **THEN** the server responds with 400 and re-renders the form with an error message

#### Scenario: Fewer than 2 answers
- **WHEN** a POST to `/admin/polls` includes fewer than 2 non-empty answer options
- **THEN** the server responds with 400 and re-renders the form with an error message indicating at least 2 options are required

#### Scenario: Answer positioning
- **WHEN** a poll is created with multiple answer options
- **THEN** each question record's `position` column starts at 10 and increments by 10 (10, 20, 30...)

### Requirement: Poll query functions
The application SHALL provide typed query functions in `src/db/queries/polls.ts` for poll and question database operations.

#### Scenario: Insert poll with questions
- **WHEN** `createPoll()` is called with poll data and an array of answer strings
- **THEN** a poll row and corresponding question rows are inserted inside a transaction, with positions starting at 10 and incrementing by 10, and the new poll ID is returned

#### Scenario: List all polls
- **WHEN** `listPolls()` is called
- **THEN** all non-soft-deleted polls are returned ordered by creation date descending, with a count of their questions
