-- Rename questions.order to questions.position
-- Convert 0-indexed values to 10-based positioning (0→10, 1→20, 2→30...)

CREATE TABLE questions_new (
  id TEXT PRIMARY KEY,
  pollId TEXT NOT NULL REFERENCES polls(id),
  body TEXT NOT NULL,
  position INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

INSERT INTO questions_new (id, pollId, body, position, createdAt, updatedAt, deletedAt)
SELECT id, pollId, body, ("order" + 1) * 10, createdAt, updatedAt, deletedAt
FROM questions;

DROP TABLE questions;

ALTER TABLE questions_new RENAME TO questions;

CREATE INDEX idx_questions_pollId ON questions(pollId);
