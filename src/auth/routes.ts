import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import {
  signSession,
  verifySession,
  SESSION_COOKIE,
  STATE_COOKIE,
  getSessionCookieOptions,
  getStateCookieOptions,
} from "./session";
import { upsertUser, isHashedIdBanned, getUserById } from "../db/queries/users";
import { computeHashedId } from "../db/hash";
import { log } from "../lib/logger";
import { getEnvOrSecret } from "../lib/config";
import { absoluteAppUrl, appPath } from "../lib/paths";

/**
 * GitHub user profile from the API response.
 * Only `id` is used — all other fields are discarded after hash computation.
 */
interface GitHubProfile {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getClientId(): string {
  const id = process.env.GITHUB_CLIENT_ID;
  if (!id) throw new Error("GITHUB_CLIENT_ID is not set");
  return id;
}

function getClientSecret(): string {
  return getEnvOrSecret(
    "GITHUB_CLIENT_SECRET",
    "aipocalypse_github_client_secret",
    "GITHUB_CLIENT_SECRET is not set"
  );
}

/**
 * Build the callback URL based on the incoming request.
 * In production behind a reverse proxy, prefer forwarded proto/host.
 */
function getCallbackUrl(requestUrl: string, forwardedProto?: string, host?: string): string {
  if (host) {
    const proto = forwardedProto?.split(",")[0]?.trim() || new URL(requestUrl).protocol.replace(":", "");
    return `${proto}://${host}${appPath("/auth/callback")}`;
  }

  return absoluteAppUrl(requestUrl, "/auth/callback");
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
  const callbackUrl = getCallbackUrl(
    c.req.url,
    c.req.header("x-forwarded-proto"),
    c.req.header("host")
  );

  setCookie(
    c,
    STATE_COOKIE,
    state,
    getStateCookieOptions(c.req.url, c.req.header("x-forwarded-proto"), c.req.header("host"))
  );

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
  const callbackUrl = getCallbackUrl(
    c.req.url,
    c.req.header("x-forwarded-proto"),
    c.req.header("host")
  );
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

  // Compute hash identity — profile data is discarded after this
  const hashedId = computeHashedId(profile.id);

  // Reject banned users before upserting
  if (isHashedIdBanned(hashedId)) {
    log.info("auth.login.banned", { userId: hashedId });
    return c.text("Your account has been banned.", 403);
  }

  // Upsert user in DB — only hashedId is stored, token is discarded
  const userId = upsertUser(hashedId);

  log.info("auth.login", { userId: hashedId });

  // Set session cookie
  const sessionToken = await signSession(userId);
  setCookie(
    c,
    SESSION_COOKIE,
    sessionToken,
    getSessionCookieOptions(c.req.url, c.req.header("x-forwarded-proto"), c.req.header("host"))
  );

  return c.redirect(appPath("/"));
});

/**
 * GET /auth/logout
 * Clear session cookie, redirect home.
 */
auth.get("/logout", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  let hashedId: string | undefined;
  if (token) {
    const uid = await verifySession(token);
    if (uid) {
      const user = getUserById(uid);
      if (user) hashedId = user.hashedId;
    }
  }
  deleteCookie(c, SESSION_COOKIE, {
    ...getSessionCookieOptions(c.req.url, c.req.header("x-forwarded-proto"), c.req.header("host")),
    maxAge: 0,
  });
  log.info("auth.logout", hashedId ? { userId: hashedId } : undefined);
  return c.redirect(appPath("/"));
});
