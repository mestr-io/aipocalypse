import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { layout } from "./views/layout";
import { admin } from "./admin/routes";

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
  const content = `
    <h1>Welcome to <span class="green">AIPocalypse</span></h1>
    <p>Community predictions on how agentic coding tools will reshape the developer profession.</p>
    <p class="dimmed">Polls coming soon.</p>
  `;
  return c.html(layout(content));
});

// Poll detail stub
app.get("/poll/:id", (c) => {
  const id = c.req.param("id");
  const content = `
    <h1>Poll Detail</h1>
    <p class="dimmed">Poll <code>${id}</code> — not yet implemented.</p>
  `;
  return c.html(layout(content, { title: "Poll Detail" }));
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
