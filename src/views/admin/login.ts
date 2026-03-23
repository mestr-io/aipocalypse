import { layout } from "../layout";
import { escapeHtml } from "../layout";

export interface AdminLoginOptions {
  error?: string;
}

/**
 * Admin login page with a password form.
 */
export function adminLoginPage(options: AdminLoginOptions = {}): string {
  const { error } = options;

  const errorHtml = error
    ? `<div class="admin-error">${escapeHtml(error)}</div>`
    : "";

  const content = `
    <h1>Admin Login</h1>
    ${errorHtml}
    <form method="POST" action="/admin/login" class="admin-form">
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autofocus>
      </div>
      <button type="submit">Sign In</button>
    </form>
  `;

  return layout(content, { title: "Admin Login" });
}
