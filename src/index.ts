import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { getCookie } from "hono/cookie";
import { layout } from "./views/layout";
import { pollListPage } from "./views/poll-list";
import { pollDetailPage } from "./views/poll-detail";
import { admin } from "./admin/routes";
import { auth } from "./auth/routes";
import { verifySession, SESSION_COOKIE } from "./auth/session";
import { getUserById, type User } from "./db/queries/users";
import { listPublicPolls, getPollWithQuestions } from "./db/queries/polls";
import { castVote, getUserVote, isValidQuestion } from "./db/queries/votes";

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = new Hono();

// ---------------------------------------------------------------------------
// 1. Static files — served first
// ---------------------------------------------------------------------------

app.use("/public/*", serveStatic({ root: "./src/" }));

// ---------------------------------------------------------------------------
// 2. Session middleware — parse cookie, look up user
// ---------------------------------------------------------------------------

app.use("*", async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  let user: User | null = null;

  if (token) {
    const userId = await verifySession(token);
    if (userId) {
      user = getUserById(userId);
      // If user is banned, treat as not logged in
      if (user?.isBanned) {
        user = null;
      }
    }
  }

  c.set("user" as never, user);
  await next();
});

// ---------------------------------------------------------------------------
// 3. Public routes
// ---------------------------------------------------------------------------

// Home page
app.get("/", (c) => {
  const user = c.get("user" as never) as User | null;
  const polls = listPublicPolls();
  return c.html(pollListPage(polls, user));
});

// Poll detail
app.get("/poll/:id", (c) => {
  const user = c.get("user" as never) as User | null;
  const id = c.req.param("id");
  const poll = getPollWithQuestions(id);

  if (!poll || poll.status === "hidden") {
    return c.text("Not Found", 404);
  }

  // Get user's current vote for this poll, if logged in
  const userVote = user ? getUserVote(user.id, id) : null;

  return c.html(pollDetailPage(poll, user, userVote));
});

// ---------------------------------------------------------------------------
// 4. Auth routes
// ---------------------------------------------------------------------------

app.route("/auth", auth);

// ---------------------------------------------------------------------------
// 5. Vote route — requires auth
// ---------------------------------------------------------------------------

app.post("/vote/:pollId", async (c) => {
  const user = c.get("user" as never) as User | null;

  if (!user) {
    return c.redirect("/auth/login");
  }

  const pollId = c.req.param("pollId");
  const body = await c.req.parseBody();
  const questionId = typeof body.questionId === "string" ? body.questionId : "";

  if (!questionId) {
    return c.redirect(`/poll/${pollId}`);
  }

  // Get the poll to check it exists and is active
  const poll = getPollWithQuestions(pollId);
  if (!poll || poll.status !== "active") {
    return c.text("Poll not found or not active.", 404);
  }

  // Validate the question belongs to this poll
  if (!isValidQuestion(questionId, pollId)) {
    return c.text("Invalid option.", 400);
  }

  // Cast or update the vote
  castVote(user.id, pollId, questionId);

  return c.redirect(`/poll/${pollId}`);
});

// ---------------------------------------------------------------------------
// 6. Admin routes — sub-app with its own guard middleware
// ---------------------------------------------------------------------------

app.route("/admin", admin);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const port = 5555;

console.log(`AIPocalypse running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
