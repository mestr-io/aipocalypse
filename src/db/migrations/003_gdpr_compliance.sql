-- GDPR compliance: remove soft-delete from users/answers, remove isBanned,
-- add banned_github_ids table, add ON DELETE CASCADE on answers.userId

-- 1. Create banned_github_ids table
CREATE TABLE banned_github_ids (
  githubId INTEGER PRIMARY KEY,
  bannedAt TEXT NOT NULL
);

-- 2. Migrate existing banned users into banned_github_ids
INSERT INTO banned_github_ids (githubId, bannedAt)
SELECT githubId, datetime('now')
FROM users
WHERE isBanned = 1;

-- 3. Hard-delete soft-deleted users and answers
DELETE FROM answers WHERE deletedAt IS NOT NULL;
DELETE FROM users WHERE deletedAt IS NOT NULL;

-- 4. Recreate users table without deletedAt and isBanned
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  githubId INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  githubUser TEXT NOT NULL UNIQUE,
  avatarUrl TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

INSERT INTO users_new (id, githubId, name, githubUser, avatarUrl, createdAt, updatedAt)
SELECT id, githubId, name, githubUser, avatarUrl, createdAt, updatedAt
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- 5. Recreate answers table without deletedAt, with ON DELETE CASCADE
CREATE TABLE answers_new (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pollId TEXT NOT NULL REFERENCES polls(id),
  questionId TEXT NOT NULL REFERENCES questions(id),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

INSERT INTO answers_new (id, userId, pollId, questionId, createdAt, updatedAt)
SELECT id, userId, pollId, questionId, createdAt, updatedAt
FROM answers;

DROP TABLE answers;
ALTER TABLE answers_new RENAME TO answers;

-- 6. Recreate indexes on answers
CREATE UNIQUE INDEX idx_answers_user_poll ON answers(userId, pollId);
CREATE INDEX idx_answers_pollId ON answers(pollId);
CREATE INDEX idx_answers_questionId ON answers(questionId);
