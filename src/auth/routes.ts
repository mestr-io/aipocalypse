import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { signSession, SESSION_COOKIE, STATE_COOKIE } from "./session";
import { upsertUser, type GitHubProfile } from "../db/queries/users";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getClientId(): string {
  const id = process.env.GITHUB_CLIENT_ID;
  if (!id) throw new Error("GITHUB_CLIENT_ID is not set");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.GITHUB_CLIENT_SECRET;
  if (!secret) throw new Error("GITHUB_CLIENT_SECRET is not set");
  return secret;
}

/**
 * Build the callback URL based on the incoming request.
 * In production behind a reverse proxy, use the original host.
 */
function getCallbackUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.protocol}//${url.host}/auth/callback`;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const auth = new Hono();

/**
 * GET /auth/login
 * Generate a random state, store it in a cookie, redirect to GitHub.
 */
auth.get("/login", (c) => {
  const state = crypto.randomUUID();
  const callbackUrl = getCallbackUrl(c.req.url);

  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: callbackUrl,
    scope: "",
    state,
    prompt: "select_account",
  });

  return c.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

/**
 * GET /auth/callback
 * Handle the OAuth callback: validate state, exchange code, fetch profile,
 * upsert user, set session cookie.
 */
auth.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, STATE_COOKIE);

  // Clear the state cookie immediately
  deleteCookie(c, STATE_COOKIE, { path: "/" });

  // Validate state
  if (!code || !state || !storedState || state !== storedState) {
    return c.text("Invalid OAuth state. Please try logging in again.", 400);
  }

  // Exchange code for access token
  const callbackUrl = getCallbackUrl(c.req.url);
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      code,
      redirect_uri: callbackUrl,
    }),
  });

  if (!tokenRes.ok) {
    return c.text("Failed to exchange authorization code.", 502);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (tokenData.error || !tokenData.access_token) {
    return c.text(
      `GitHub OAuth error: ${tokenData.error_description || tokenData.error || "unknown"}`,
      400
    );
  }

  // Fetch user profile
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "AIPocalypse/1.0",
    },
  });

  if (!userRes.ok) {
    return c.text("Failed to fetch GitHub profile.", 502);
  }

  const profile = (await userRes.json()) as GitHubProfile;

  // Upsert user in DB — token is discarded after this
  const userId = upsertUser(profile);

  // Set session cookie
  const sessionToken = await signSession(userId);
  setCookie(c, SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return c.redirect("/");
});

/**
 * GET /auth/logout
 * Clear session cookie, redirect home.
 */
auth.get("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.redirect("/");
});
