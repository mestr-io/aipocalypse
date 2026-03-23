## MODIFIED Requirements

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
The application SHALL provide typed query functions in `src/db/queries/polls.ts` for poll and question database operations.

#### Scenario: Insert poll with questions
- **WHEN** `createPoll()` is called with poll data and an array of answer strings
- **THEN** a poll row and corresponding question rows are inserted inside a transaction, with positions starting at 10 and incrementing by 10, and the new poll ID is returned

#### Scenario: List all polls including deleted
- **WHEN** `listPolls()` is called
- **THEN** all polls (including soft-deleted) are returned ordered by creation date descending, with a count of their non-deleted questions and the `deletedAt` timestamp
