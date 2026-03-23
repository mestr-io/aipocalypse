import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { upsertUser, getUserById, type GitHubProfile } from "./users";
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
      expect(user!.isBanned).toBe(0);
      expect(user!.deletedAt).toBeNull();
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

    test("restores soft-deleted user on re-login", () => {
      const { getDb } = require("../index");
      const id = upsertUser(PROFILE);
      getDb().run("UPDATE users SET deletedAt = ? WHERE id = ?", [
        new Date().toISOString(),
        id,
      ]);

      // User should not be found
      expect(getUserById(id)).toBeNull();

      // Re-login should restore them
      const id2 = upsertUser(PROFILE);
      expect(id2).toBe(id);
      expect(getUserById(id)).not.toBeNull();
      expect(getUserById(id)!.deletedAt).toBeNull();
    });
  });

  describe("getUserById", () => {
    test("returns null for non-existent ID", () => {
      expect(getUserById("nonexistent")).toBeNull();
    });

    test("returns null for soft-deleted user", () => {
      const { getDb } = require("../index");
      const id = upsertUser(PROFILE);
      getDb().run("UPDATE users SET deletedAt = ? WHERE id = ?", [
        new Date().toISOString(),
        id,
      ]);
      expect(getUserById(id)).toBeNull();
    });
  });
});
