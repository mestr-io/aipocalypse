import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { layout } from "./views/layout";
import { pollListPage } from "./views/poll-list";
import { pollDetailPage } from "./views/poll-detail";
import { admin } from "./admin/routes";
import { listActivePolls, getPollWithQuestions } from "./db/queries/polls";

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = new Hono();

// ---------------------------------------------------------------------------
// 1. Static files — served first
// ---------------------------------------------------------------------------

app.use("/public/*", serveStatic({ root: "./src/" }));

// ---------------------------------------------------------------------------
// 2. Session placeholder middleware — no-op for now
// ---------------------------------------------------------------------------

app.use("*", async (c, next) => {
  // Future: parse session cookie, look up user, set c.set("user", user)
  c.set("user" as never, null);
  await next();
});

// ---------------------------------------------------------------------------
// 3. Routes
// ---------------------------------------------------------------------------

// Home page
app.get("/", (c) => {
  const polls = listActivePolls();
  return c.html(pollListPage(polls));
});

// Poll detail
app.get("/poll/:id", (c) => {
  const id = c.req.param("id");
  const poll = getPollWithQuestions(id);

  if (!poll || poll.status === "hidden") {
    return c.text("Not Found", 404);
  }

  return c.html(pollDetailPage(poll));
});

// Auth routes
app.get("/auth/login", (c) => {
  const content = `
    <h1>Sign In</h1>
    <p class="dimmed">GitHub OAuth login — not yet implemented.</p>
  `;
  return c.html(layout(content, { title: "Sign In" }));
});

app.get("/auth/callback", (c) => {
  return c.text("Auth callback — not yet implemented.", 501);
});

app.get("/auth/logout", (c) => {
  return c.text("Logged out — not yet implemented.", 501);
});

// Vote route — requires auth (not yet implemented)
app.post("/vote/:pollId", (c) => {
  return c.text("Unauthorized", 401);
});

// Admin routes — sub-app with its own guard middleware
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
