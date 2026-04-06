import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { adminGuard } from "./middleware";
import { checkPassword, signToken, COOKIE_NAME, getAdminCookieOptions } from "./auth";
import {
  isAdminLoginRateLimited,
  recordAdminLoginFailure,
  resetAdminLoginFailures,
} from "./rate-limit";
import { adminLoginPage } from "../views/admin/login";
import { adminDashboardPage } from "../views/admin/dashboard";
import { adminPollFormPage, type AnswerValue } from "../views/admin/poll-form";
import { createPoll, listPolls, getPollForEdit, updatePoll } from "../db/queries/polls";
import { createAdminCsrfToken, verifyAdminCsrfToken } from "../lib/csrf";
import { log } from "../lib/logger";
import { appPath } from "../lib/paths";
import { getClientKey } from "../lib/request";

const admin = new Hono();

// ---------------------------------------------------------------------------
// Admin guard — protects all /admin/* except /admin/login
// ---------------------------------------------------------------------------

admin.use("*", adminGuard);

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

admin.get("/login", async (c) => {
  const csrfToken = await createAdminCsrfToken("admin-login", "anonymous");
  return c.html(adminLoginPage({ csrfToken }));
});

admin.post("/login", async (c) => {
  const clientKey = getClientKey(c.req.header("x-forwarded-for"), c.req.header("x-real-ip"));
  if (isAdminLoginRateLimited(clientKey)) {
    log.info("admin.login.failed", { reason: "rate-limited" });
    const csrfToken = await createAdminCsrfToken("admin-login", "anonymous");
    return c.html(adminLoginPage({ error: "Too many attempts. Try again later.", csrfToken }), 429);
  }

  const body = await c.req.parseBody();
  const password = body.password;
  const csrfToken = typeof body.csrfToken === "string" ? body.csrfToken : "";

  if (!(await verifyAdminCsrfToken(csrfToken, "admin-login", "anonymous"))) {
    log.info("security.csrf.rejected", { route: "/admin/login", scope: "admin-login" });
    return c.text("Forbidden", 403);
  }

  if (typeof password !== "string" || !checkPassword(password)) {
    recordAdminLoginFailure(clientKey);
    log.info("admin.login.failed", { reason: "invalid-password" });
    const nextCsrfToken = await createAdminCsrfToken("admin-login", "anonymous");
    return c.html(adminLoginPage({ error: "Invalid password.", csrfToken: nextCsrfToken }), 401);
  }

  resetAdminLoginFailures(clientKey);
  const token = await signToken();
  setCookie(
    c,
    COOKIE_NAME,
    token,
    getAdminCookieOptions(c.req.url, c.req.header("x-forwarded-proto"), c.req.header("host"))
  );
  log.info("admin.login");
  return c.redirect(appPath("/admin"));
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

admin.get("/logout", (c) => {
  deleteCookie(c, COOKIE_NAME, {
    ...getAdminCookieOptions(c.req.url, c.req.header("x-forwarded-proto"), c.req.header("host")),
    maxAge: 0,
  });
  log.info("admin.logout");
  return c.redirect(appPath("/admin/login"));
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

admin.get("/polls/new", async (c) => {
  const csrfToken = await createAdminCsrfToken("admin-poll");
  return c.html(adminPollFormPage({ csrfToken }));
});

admin.post("/polls", async (c) => {
  const body = await c.req.parseBody({ all: true });
  const csrfToken = typeof body.csrfToken === "string" ? body.csrfToken : "";

  if (!(await verifyAdminCsrfToken(csrfToken, "admin-poll"))) {
    log.info("security.csrf.rejected", { route: "/admin/polls", scope: "admin-poll" });
    return c.text("Forbidden", 403);
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";
  const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
  const status = typeof body.status === "string" ? body.status : "hidden";
  const links = typeof body.links === "string" ? body.links.trim() : "";

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
        values: { title, body: bodyText, dueDate, status, links, answers: answers.map((a) => ({ text: a })) },
        csrfToken: await createAdminCsrfToken("admin-poll"),
      }),
      400
    );
  }

  const pollId = createPoll(
    {
      title,
      body: bodyText,
      dueDate: dueDate || null,
      status,
      links,
    },
    answers
  );

  log.info("admin.poll.created", { pollId, title });
  return c.redirect(appPath("/admin"));
});

// ---------------------------------------------------------------------------
// Poll editing
// ---------------------------------------------------------------------------

admin.get("/polls/:id/edit", async (c) => {
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
        links: poll.links,
        answers: poll.questions.map((q) => ({ id: q.id, text: q.body })),
      },
      csrfToken: await createAdminCsrfToken("admin-poll"),
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
  const csrfToken = typeof body.csrfToken === "string" ? body.csrfToken : "";

  if (!(await verifyAdminCsrfToken(csrfToken, "admin-poll"))) {
    log.info("security.csrf.rejected", { route: "/admin/polls/:id", scope: "admin-poll" });
    return c.text("Forbidden", 403);
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";
  const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
  const status = typeof body.status === "string" ? body.status : "hidden";
  const links = typeof body.links === "string" ? body.links.trim() : "";

  const rawAnswers = body["answers[]"];
  const rawAnswerIds = body["answerIds[]"];
  const answerTexts: string[] = (Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers])
    .filter((a): a is string => typeof a === "string")
    .map((a) => a.trim());
  const answerIds: string[] = (Array.isArray(rawAnswerIds) ? rawAnswerIds : [rawAnswerIds])
    .filter((a): a is string => typeof a === "string");

  // Pair IDs with text, filtering out empty text entries
  const answerPairs: AnswerValue[] = [];
  for (let i = 0; i < answerTexts.length; i++) {
    if (answerTexts[i]!.length > 0) {
      const id = answerIds[i]?.trim() || undefined;
      answerPairs.push({ id: id || undefined, text: answerTexts[i]! });
    }
  }

  // Validation
  const errors: string[] = [];
  if (!title) errors.push("Title is required.");
  if (answerPairs.length < 2) errors.push("At least 2 answer options are required.");
  if (status !== "hidden" && status !== "active" && status !== "done") {
    errors.push("Invalid status.");
  }

  if (errors.length > 0) {
    return c.html(
      adminPollFormPage({
        pollId,
        error: errors.join(" "),
        values: { title, body: bodyText, dueDate, status, links, answers: answerPairs },
        csrfToken: await createAdminCsrfToken("admin-poll"),
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
      links,
    },
    answerPairs
  );

  log.info("admin.poll.updated", { pollId, title });
  return c.redirect(appPath("/admin"));
});

export { admin };
