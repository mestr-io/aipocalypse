import { appPath } from "../../lib/paths";
import { adminLayout } from "../admin-layout";
import { escapeHtml } from "../layout";

export interface AdminLoginOptions {
  error?: string;
  csrfToken?: string;
}

/**
 * Admin login page with a password form.
 */
export function adminLoginPage(options: AdminLoginOptions = {}): string {
  const { error, csrfToken = "" } = options;

  const errorHtml = error
    ? `<div class="admin-error">${escapeHtml(error)}</div>`
    : "";

  const content = `
    <h1>Admin Login</h1>
    ${errorHtml}
    <form method="POST" action="${appPath("/admin/login")}" class="admin-form">
      <input type="hidden" name="csrfToken" value="${escapeHtml(csrfToken)}">
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autofocus>
      </div>
      <button type="submit">Sign In</button>
    </form>
  `;

  return adminLayout(content, { title: "Admin Login" });
}
