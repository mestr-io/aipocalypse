import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { signSession } from "./auth/session";
import { signToken } from "./admin/auth";
import { resetAdminLoginRateLimitStore } from "./admin/rate-limit";
import { createPoll } from "./db/queries/polls";
import { upsertUser, banHashedId, getUserById } from "./db/queries/users";
import { getUserVote } from "./db/queries/votes";
import { getDb, closeDb } from "./db";
import { runMigrations } from "./db/migrate";

const TEST_DIR = join(import.meta.dirname!, "../.test-tmp");
const TEST_DB_PATH = join(TEST_DIR, "test-security-routes.db");
const ORIGINAL_ENV = { ...process.env };
const consoleSpy = spyOn(console, "log");

let app: { fetch: (request: Request) => Promise<Response> };
let userId = "";
let userHash = "";
let pollId = "";
let questionId = "";

function getLatestJsonLog(): Record<string, unknown> {
  for (let i = consoleSpy.mock.calls.length - 1; i >= 0; i--) {
    const value = consoleSpy.mock.calls[i]?.[0];
    if (typeof value !== "string") continue;
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      continue;
    }
  }

  throw new Error("No JSON log entry found");
}

function restoreEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

async function getUserCookie(): Promise<string> {
  return `aipocalypse_session=${await signSession(userId)}`;
}

async function getAdminCookie(): Promise<string> {
  return `admin_session=${await signToken()}`;
}

beforeAll(async () => {
  process.env.DATABASE_PATH = TEST_DB_PATH;
  process.env.HASH_PEPPER = "test-hash-pepper";
  process.env.SESSION_SECRET = "test-session-secret";
  process.env.ADMIN_PASSWORD = "test-admin-password";
  process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret";
  process.env.GITHUB_CLIENT_ID = "test-client-id";
  ({ default: app } = await import("./index"));
});

beforeEach(() => {
  consoleSpy.mockClear();
  resetAdminLoginRateLimitStore();
  closeDb();
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
  process.env.DATABASE_PATH = TEST_DB_PATH;
  runMigrations();

  userHash = "aabbcc112233445566";
  userId = upsertUser(userHash);
  pollId = createPoll(
    { title: "Security Poll", body: "Pick one", dueDate: null, status: "active", links: "" },
    ["Option A", "Option B"]
  );
  const rows = getDb()
    .query<{ id: string }, [string]>("SELECT id FROM questions WHERE pollId = ? ORDER BY position")
    .all(pollId);
  questionId = rows[0]!.id;
});

afterEach(() => {
  closeDb();
  rmSync(TEST_DIR, { recursive: true, force: true });
});

afterAll(() => {
  consoleSpy.mockRestore();
  restoreEnv();
});

describe("security-sensitive routes", () => {
  test("poll detail renders csrf token for authenticated user", async () => {
    const response = await app.fetch(new Request(`http://localhost/poll/${pollId}`, {
      headers: { cookie: await getUserCookie() },
    }));

    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('name="csrfToken"');
  });

  test("account page renders csrf token for delete form", async () => {
    const response = await app.fetch(new Request("http://localhost/account", {
      headers: { cookie: await getUserCookie() },
    }));

    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('name="csrfToken"');
    expect(html).toContain('action="/account/delete"');
  });

  test("vote submission without csrf token is rejected and logged", async () => {
    const body = new URLSearchParams({ questionId });
    const response = await app.fetch(new Request(`http://localhost/vote/${pollId}`, {
      method: "POST",
      headers: {
        cookie: await getUserCookie(),
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    }));

    expect(response.status).toBe(403);
    expect(getUserVote(userId, pollId)).toBeNull();
    const logEntry = getLatestJsonLog();
    expect(logEntry.action).toBe("security.csrf.rejected");
    expect(logEntry.userId).toBe(userHash);
  });

  test("account deletion without csrf token is rejected", async () => {
    const response = await app.fetch(new Request("http://localhost/account/delete", {
      method: "POST",
      headers: {
        cookie: await getUserCookie(),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(),
    }));

    expect(response.status).toBe(403);
    expect(getUserById(userId)).not.toBeNull();
  });

  test("admin login page renders csrf token", async () => {
    const response = await app.fetch(new Request("http://localhost/admin/login"));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('name="csrfToken"');
  });

  test("admin login without csrf token is rejected and logged", async () => {
    const response = await app.fetch(new Request("http://localhost/admin/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ password: "wrong" }),
    }));

    expect(response.status).toBe(403);
    const logEntry = getLatestJsonLog();
    expect(logEntry.action).toBe("security.csrf.rejected");
    expect(logEntry.scope).toBe("admin-login");
  });

  test("admin login invalid password and rate limiting are logged", async () => {
    const loginPage = await app.fetch(new Request("http://localhost/admin/login"));
    const html = await loginPage.text();
    const match = html.match(/name="csrfToken" value="([^"]+)"/);
    const csrfToken = match?.[1] ?? "";

    let lastResponse: Response | null = null;
    for (let i = 0; i < 5; i++) {
      lastResponse = await app.fetch(new Request("http://localhost/admin/login", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, password: "wrong" }),
      }));
    }

    expect(lastResponse?.status).toBe(401);
    let logEntry = getLatestJsonLog();
    expect(logEntry.action).toBe("admin.login.failed");
    expect(logEntry.reason).toBe("invalid-password");
    expect(logEntry.password).toBeUndefined();

    const throttled = await app.fetch(new Request("http://localhost/admin/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken, password: "wrong" }),
    }));

    expect(throttled.status).toBe(429);
    logEntry = getLatestJsonLog();
    expect(logEntry.action).toBe("admin.login.failed");
    expect(logEntry.reason).toBe("rate-limited");
  });

  test("admin poll mutation without csrf token is rejected", async () => {
    const response = await app.fetch(new Request("http://localhost/admin/polls", {
      method: "POST",
      headers: {
        cookie: await getAdminCookie(),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        title: "New Poll",
        body: "Body",
        status: "hidden",
        "answers[]": "A",
      }),
    }));

    expect(response.status).toBe(403);
  });

  test("banned user vote is rejected, logged, and clears session", async () => {
    const csrfTokenResponse = await app.fetch(new Request(`http://localhost/poll/${pollId}`, {
      headers: { cookie: await getUserCookie() },
    }));
    const html = await csrfTokenResponse.text();
    const match = html.match(/name="csrfToken" value="([^"]+)"/);
    const csrfToken = match?.[1] ?? "";

    banHashedId(userHash);

    const response = await app.fetch(new Request(`http://localhost/vote/${pollId}`, {
      method: "POST",
      headers: {
        cookie: await getUserCookie(),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ csrfToken, questionId }),
    }));

    expect(response.status).toBe(403);
    expect(getUserVote(userId, pollId)).toBeNull();
    expect(response.headers.get("set-cookie") ?? "").toContain("Max-Age=0");

    const logEntry = getLatestJsonLog();
    expect(logEntry.action).toBe("user.vote.rejected.banned");
    expect(logEntry.userId).toBe(userHash);
  });
});
