import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyToken, COOKIE_NAME } from "./auth";

/**
 * Admin guard middleware.
 * Checks the admin_session cookie and redirects to /admin/login if invalid.
 * Skips the check for /admin/login itself (GET and POST).
 */
export async function adminGuard(c: Context, next: Next): Promise<Response | void> {
  const path = new URL(c.req.url).pathname;

  // Allow login page through without auth
  if (path === "/admin/login") {
    return next();
  }

  const token = getCookie(c, COOKIE_NAME);

  if (!token || !(await verifyToken(token))) {
    return c.redirect("/admin/login");
  }

  return next();
}
