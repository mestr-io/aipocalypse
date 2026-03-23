## MODIFIED Requirements

### Requirement: Initial schema migration
The project SHALL include `src/db/migrations/001_initial_schema.sql` containing CREATE TABLE statements for `users`, `polls`, `questions`, and `answers` with all columns, constraints, and indexes as defined in `docs/models.md`. The `questions` table SHALL use `position` (not `order`) as the column name for display ordering.

#### Scenario: Schema creates all four tables
- **WHEN** the initial migration runs
- **THEN** the database contains tables `users`, `polls`, `questions`, and `answers` with all columns matching the documented schema

#### Scenario: Indexes are created
- **WHEN** the initial migration runs
- **THEN** indexes `idx_questions_pollId`, `idx_answers_pollId`, `idx_answers_questionId`, and the unique partial index `idx_answers_user_poll` exist

## ADDED Requirements

### Requirement: Position column migration
The project SHALL include `src/db/migrations/002_rename_order_to_position.sql` that renames the `questions.order` column to `position` and converts existing 0-indexed values to 10-based positioning.

#### Scenario: Column renamed from order to position
- **WHEN** migration 002 runs
- **THEN** the `questions` table has a `position INTEGER NOT NULL` column and no `order` column

#### Scenario: Existing values converted to 10-based
- **WHEN** migration 002 runs on a database with existing questions having `order` values 0, 1, 2
- **THEN** the corresponding `position` values are 10, 20, 30

#### Scenario: Index preserved
- **WHEN** migration 002 runs
- **THEN** the `idx_questions_pollId` index exists on the new `questions` table
