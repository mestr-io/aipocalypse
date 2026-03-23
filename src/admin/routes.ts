import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { adminGuard } from "./middleware";
import { checkPassword, signToken, COOKIE_NAME, COOKIE_OPTIONS } from "./auth";
import { adminLoginPage } from "../views/admin/login";
import { adminDashboardPage } from "../views/admin/dashboard";
import { adminPollFormPage } from "../views/admin/poll-form";
import { createPoll, listPolls, getPollForEdit, updatePoll } from "../db/queries/polls";

const admin = new Hono();

// ---------------------------------------------------------------------------
// Admin guard — protects all /admin/* except /admin/login
// ---------------------------------------------------------------------------

admin.use("*", adminGuard);

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

admin.get("/login", (c) => {
  return c.html(adminLoginPage());
});

admin.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const password = body.password;

  if (typeof password !== "string" || !checkPassword(password)) {
    return c.html(adminLoginPage({ error: "Invalid password." }), 401);
  }

  const token = await signToken();
  setCookie(c, COOKIE_NAME, token, COOKIE_OPTIONS);
  return c.redirect("/admin");
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

admin.get("/logout", (c) => {
  deleteCookie(c, COOKIE_NAME, { path: "/admin" });
  return c.redirect("/admin/login");
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

admin.get("/", (c) => {
  const polls = listPolls();
  return c.html(adminDashboardPage(polls));
});

// ---------------------------------------------------------------------------
// Poll creation
// ---------------------------------------------------------------------------

admin.get("/polls/new", (c) => {
  return c.html(adminPollFormPage());
});

admin.post("/polls", async (c) => {
  const body = await c.req.parseBody({ all: true });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";
  const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
  const status = typeof body.status === "string" ? body.status : "hidden";

  // Collect answers — parseBody with `all: true` returns arrays for repeated fields
  const rawAnswers = body["answers[]"];
  const answers: string[] = (Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers])
    .filter((a): a is string => typeof a === "string")
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

  // Validation
  const errors: string[] = [];
  if (!title) errors.push("Title is required.");
  if (answers.length < 2) errors.push("At least 2 answer options are required.");
  if (status !== "hidden" && status !== "active" && status !== "done") {
    errors.push("Invalid status.");
  }

  if (errors.length > 0) {
    return c.html(
      adminPollFormPage({
        error: errors.join(" "),
        values: { title, body: bodyText, dueDate, status, answers },
      }),
      400
    );
  }

  createPoll(
    {
      title,
      body: bodyText,
      dueDate: dueDate || null,
      status,
    },
    answers
  );

  return c.redirect("/admin");
});

// ---------------------------------------------------------------------------
// Poll editing
// ---------------------------------------------------------------------------

admin.get("/polls/:id/edit", (c) => {
  const pollId = c.req.param("id");
  const poll = getPollForEdit(pollId);

  if (!poll) {
    return c.text("Poll not found", 404);
  }

  return c.html(
    adminPollFormPage({
      pollId: poll.id,
      values: {
        title: poll.name,
        body: poll.body,
        dueDate: poll.dueDate,
        status: poll.status,
        answers: poll.questions.map((q) => q.body),
      },
    })
  );
});

admin.post("/polls/:id", async (c) => {
  const pollId = c.req.param("id");

  // Verify poll exists before processing
  const existing = getPollForEdit(pollId);
  if (!existing) {
    return c.text("Poll not found", 404);
  }

  const body = await c.req.parseBody({ all: true });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";
  const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
  const status = typeof body.status === "string" ? body.status : "hidden";

  const rawAnswers = body["answers[]"];
  const answers: string[] = (Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers])
    .filter((a): a is string => typeof a === "string")
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

  // Validation
  const errors: string[] = [];
  if (!title) errors.push("Title is required.");
  if (answers.length < 2) errors.push("At least 2 answer options are required.");
  if (status !== "hidden" && status !== "active" && status !== "done") {
    errors.push("Invalid status.");
  }

  if (errors.length > 0) {
    return c.html(
      adminPollFormPage({
        pollId,
        error: errors.join(" "),
        values: { title, body: bodyText, dueDate, status, answers },
      }),
      400
    );
  }

  updatePoll(
    pollId,
    {
      title,
      body: bodyText,
      dueDate: dueDate || null,
      status,
    },
    answers
  );

  return c.redirect("/admin");
});

export { admin };
