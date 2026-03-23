/**
 * Seed script: generates synthetic users and votes for the active poll.
 *
 * Creates 100 fake users and distributes votes across poll options
 * with a realistic skew (~40/25/20/15%).
 *
 * Usage: bun run scripts/seed.ts
 *
 * Idempotent: clears previous seed data (users with githubUser starting
 * with "seed_user_") before inserting fresh data.
 */

import { getDb } from "../src/db/index.ts";
import { generateUUIDv7 } from "../src/db/uuid.ts";

const SEED_USER_COUNT = 100;
const SEED_PREFIX = "seed_user_";
const SEED_GITHUB_ID_START = 900_000;

// Realistic vote distribution weights (must match number of options)
// Will be normalized and distributed across however many questions exist
const WEIGHTS = [40, 25, 20, 15];

function now(): string {
  return new Date().toISOString();
}

function main() {
  const db = getDb();

  // Find the active poll
  const poll = db
    .query<
      { id: string; name: string },
      []
    >("SELECT id, name FROM polls WHERE status = 'active' AND deletedAt IS NULL LIMIT 1")
    .get();

  if (!poll) {
    console.error("No active poll found. Create and activate a poll first.");
    process.exit(1);
  }

  console.log(`Poll: "${poll.name}" (${poll.id})`);

  // Get non-deleted questions for this poll, ordered by position
  const questions = db
    .query<
      { id: string; body: string; position: number },
      [string]
    >(
      "SELECT id, body, position FROM questions WHERE pollId = ? AND deletedAt IS NULL ORDER BY position",
    )
    .all(poll.id);

  if (questions.length === 0) {
    console.error("Poll has no questions.");
    process.exit(1);
  }

  console.log(`Questions (${questions.length}):`);
  for (const q of questions) {
    console.log(`  ${q.position}. ${q.body}`);
  }

  // Build vote distribution
  const distribution = buildDistribution(questions.length, SEED_USER_COUNT);

  console.log(`\nVote distribution:`);
  for (let i = 0; i < questions.length; i++) {
    const pct = ((distribution[i]! / SEED_USER_COUNT) * 100).toFixed(0);
    console.log(`  "${questions[i]!.body}" -> ${distribution[i]} votes (${pct}%)`);
  }

  // Run everything in a transaction
  const timestamp = now();

  db.run("BEGIN");
  try {
    // Clear previous seed data
    const existingSeedUsers = db
      .query<{ id: string }, []>(
        `SELECT id FROM users WHERE githubUser LIKE '${SEED_PREFIX}%'`,
      )
      .all();

    if (existingSeedUsers.length > 0) {
      const ids = existingSeedUsers.map((u) => u.id);
      // Delete answers from seed users
      db.run(
        `DELETE FROM answers WHERE userId IN (${ids.map(() => "?").join(",")})`,
        ...ids,
      );
      // Delete seed users
      db.run(
        `DELETE FROM users WHERE id IN (${ids.map(() => "?").join(",")})`,
        ...ids,
      );
      console.log(`\nCleared ${existingSeedUsers.length} previous seed users and their votes.`);
    }

    // Create seed users
    const insertUser = db.prepare(
      "INSERT INTO users (id, githubId, name, githubUser, avatarUrl, isBanned, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
    );

    const userIds: string[] = [];
    for (let i = 0; i < SEED_USER_COUNT; i++) {
      const id = generateUUIDv7();
      const num = String(i + 1).padStart(3, "0");
      insertUser.run(
        id,
        SEED_GITHUB_ID_START + i,
        `Seed User ${num}`,
        `${SEED_PREFIX}${num}`,
        `https://avatars.githubusercontent.com/u/${SEED_GITHUB_ID_START + i}`,
        timestamp,
        timestamp,
      );
      userIds.push(id);
    }

    console.log(`Created ${SEED_USER_COUNT} seed users.`);

    // Create answers based on distribution
    const insertAnswer = db.prepare(
      "INSERT INTO answers (id, userId, pollId, questionId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    );

    let userIndex = 0;
    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const voteCount = distribution[qIdx]!;
      for (let v = 0; v < voteCount; v++) {
        // Spread timestamps over the last 7 days for realism
        const daysAgo = Math.random() * 7;
        const voteTime = new Date(Date.now() - daysAgo * 86_400_000).toISOString();

        insertAnswer.run(
          generateUUIDv7(),
          userIds[userIndex]!,
          poll.id,
          questions[qIdx]!.id,
          voteTime,
          voteTime,
        );
        userIndex++;
      }
    }

    console.log(`Created ${SEED_USER_COUNT} votes.`);

    db.run("COMMIT");
    console.log("\nSeed complete.");
  } catch (err) {
    db.run("ROLLBACK");
    console.error("Seed failed, rolled back:", err);
    process.exit(1);
  }
}

/**
 * Distributes `total` votes across `count` options using the WEIGHTS array.
 * If there are more options than weights, remaining options get equal share
 * of whatever's left. Returns an array of integer vote counts summing to `total`.
 */
function buildDistribution(count: number, total: number): number[] {
  // Use as many weights as we have, pad with equal share for extras
  const raw: number[] = [];
  let weightSum = 0;

  for (let i = 0; i < count; i++) {
    const w = i < WEIGHTS.length ? WEIGHTS[i]! : 5;
    raw.push(w);
    weightSum += w;
  }

  // Convert to vote counts
  const votes = raw.map((w) => Math.floor((w / weightSum) * total));

  // Distribute remainder to top options
  let remainder = total - votes.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0; i = (i + 1) % count) {
    votes[i]!++;
    remainder--;
  }

  return votes;
}

main();
