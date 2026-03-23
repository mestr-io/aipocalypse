-- Initial schema: users, polls, questions, answers

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  githubId INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  githubUser TEXT NOT NULL UNIQUE,
  avatarUrl TEXT NOT NULL,
  isBanned INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE TABLE polls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  dueDate TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'hidden' CHECK (status IN ('hidden', 'active', 'done')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  pollId TEXT NOT NULL REFERENCES polls(id),
  body TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE INDEX idx_questions_pollId ON questions(pollId);

CREATE TABLE answers (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  pollId TEXT NOT NULL REFERENCES polls(id),
  questionId TEXT NOT NULL REFERENCES questions(id),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE UNIQUE INDEX idx_answers_user_poll ON answers(userId, pollId) WHERE deletedAt IS NULL;
CREATE INDEX idx_answers_pollId ON answers(pollId);
CREATE INDEX idx_answers_questionId ON answers(questionId);
