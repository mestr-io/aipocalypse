import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  upsertUser,
  getUserById,
  isGithubIdBanned,
  banGithubId,
  unbanGithubId,
  hardDeleteUser,
  exportUserData,
  type GitHubProfile,
} from "./users";
import { createPoll } from "./polls";
import { castVote } from "./votes";
import { runMigrations } from "../migrate";

const TEST_DIR = join(import.meta.dirname!, "../../../.test-tmp");
const TEST_DB_PATH = join(TEST_DIR, "test-users.db");

beforeEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
  process.env.DATABASE_PATH = TEST_DB_PATH;
  runMigrations();
});

afterEach(() => {
  const { closeDb } = require("../index");
  closeDb();
  rmSync(TEST_DIR, { recursive: true, force: true });
  delete process.env.DATABASE_PATH;
});

const PROFILE: GitHubProfile = {
  id: 12345,
  login: "octocat",
  name: "The Octocat",
  avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
};

// ---------------------------------------------------------------------------
// upsertUser / getUserById
// ---------------------------------------------------------------------------

describe("users", () => {
  describe("upsertUser", () => {
    test("inserts a new user and returns their ID", () => {
      const userId = upsertUser(PROFILE);
      expect(userId).toBeTruthy();
      expect(typeof userId).toBe("string");

      const user = getUserById(userId);
      expect(user).not.toBeNull();
      expect(user!.githubId).toBe(12345);
      expect(user!.name).toBe("The Octocat");
      expect(user!.githubUser).toBe("octocat");
      expect(user!.avatarUrl).toBe(PROFILE.avatar_url);
    });

    test("uses login as name when name is null", () => {
      const profile: GitHubProfile = { ...PROFILE, name: null };
      const userId = upsertUser(profile);
      const user = getUserById(userId);
      expect(user!.name).toBe("octocat");
    });

    test("returns same ID on second upsert with same githubId", () => {
      const id1 = upsertUser(PROFILE);
      const id2 = upsertUser(PROFILE);
      expect(id1).toBe(id2);
    });

    test("updates profile fields on re-login", () => {
      const id = upsertUser(PROFILE);

      const updatedProfile: GitHubProfile = {
        ...PROFILE,
        name: "New Name",
        login: "newlogin",
        avatar_url: "https://new-avatar.com/pic.png",
      };

      const id2 = upsertUser(updatedProfile);
      expect(id2).toBe(id);

      const user = getUserById(id);
      expect(user!.name).toBe("New Name");
      expect(user!.githubUser).toBe("newlogin");
      expect(user!.avatarUrl).toBe("https://new-avatar.com/pic.png");
    });
  });

  describe("getUserById", () => {
    test("returns null for non-existent ID", () => {
      expect(getUserById("nonexistent")).toBeNull();
    });

    test("returns user for valid ID", () => {
      const id = upsertUser(PROFILE);
      const user = getUserById(id);
      expect(user).not.toBeNull();
      expect(user!.id).toBe(id);
    });
  });

  // ---------------------------------------------------------------------------
  // Ban management
  // ---------------------------------------------------------------------------

  describe("ban management", () => {
    test("isGithubIdBanned returns false for non-banned ID", () => {
      expect(isGithubIdBanned(99999)).toBe(false);
    });

    test("banGithubId bans a GitHub ID", () => {
      banGithubId(12345);
      expect(isGithubIdBanned(12345)).toBe(true);
    });

    test("banGithubId is a no-op if already banned", () => {
      banGithubId(12345);
      banGithubId(12345); // should not throw
      expect(isGithubIdBanned(12345)).toBe(true);
    });

    test("unbanGithubId removes the ban", () => {
      banGithubId(12345);
      expect(isGithubIdBanned(12345)).toBe(true);

      unbanGithubId(12345);
      expect(isGithubIdBanned(12345)).toBe(false);
    });

    test("unbanGithubId is a no-op if not banned", () => {
      unbanGithubId(99999); // should not throw
      expect(isGithubIdBanned(99999)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // GDPR: hard delete
  // ---------------------------------------------------------------------------

  describe("hardDeleteUser", () => {
    test("deletes a user and returns true", () => {
      const id = upsertUser(PROFILE);
      expect(hardDeleteUser(id)).toBe(true);
      expect(getUserById(id)).toBeNull();
    });

    test("returns false for non-existent user", () => {
      expect(hardDeleteUser("nonexistent")).toBe(false);
    });

    test("cascades to answers", () => {
      const { getDb } = require("../index");
      const userId = upsertUser(PROFILE);

      // Create a poll and cast a vote
      const pollId = createPoll(
        { title: "Test Poll", body: "", dueDate: null, status: "active" },
        ["A", "B"]
      );
      const rows = getDb()
        .query<{ id: string }, [string]>(
          "SELECT id FROM questions WHERE pollId = ? ORDER BY position"
        )
        .all(pollId);
      castVote(userId, pollId, rows[0]!.id);

      // Verify answer exists
      const before = getDb()
        .query<{ id: string }, [string]>(
          "SELECT id FROM answers WHERE userId = ?"
        )
        .all(userId);
      expect(before).toHaveLength(1);

      // Delete user — answers should cascade
      hardDeleteUser(userId);

      const after = getDb()
        .query<{ id: string }, [string]>(
          "SELECT id FROM answers WHERE userId = ?"
        )
        .all(userId);
      expect(after).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // GDPR: data export
  // ---------------------------------------------------------------------------

  describe("exportUserData", () => {
    test("returns null for non-existent user", () => {
      expect(exportUserData("nonexistent")).toBeNull();
    });

    test("exports user profile data", () => {
      const id = upsertUser(PROFILE);
      const data = exportUserData(id);
      expect(data).not.toBeNull();
      expect(data!.user.githubUser).toBe("octocat");
      expect(data!.user.name).toBe("The Octocat");
      expect(data!.user.avatarUrl).toBe(PROFILE.avatar_url);
      expect(data!.user.createdAt).toBeTruthy();
      expect(data!.exportedAt).toBeTruthy();
      expect(data!.votes).toEqual([]);
    });

    test("exports user votes", () => {
      const { getDb } = require("../index");
      const userId = upsertUser(PROFILE);

      const pollId = createPoll(
        { title: "Export Poll", body: "", dueDate: null, status: "active" },
        ["Option X", "Option Y"]
      );
      const rows = getDb()
        .query<{ id: string }, [string]>(
          "SELECT id FROM questions WHERE pollId = ? ORDER BY position"
        )
        .all(pollId);
      castVote(userId, pollId, rows[0]!.id);

      const data = exportUserData(userId);
      expect(data!.votes).toHaveLength(1);
      expect(data!.votes[0]!.poll).toBe("Export Poll");
      expect(data!.votes[0]!.question).toBe("Option X");
      expect(data!.votes[0]!.votedAt).toBeTruthy();
    });
  });
});
