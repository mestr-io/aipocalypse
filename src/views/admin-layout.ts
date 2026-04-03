import { escapeHtml } from "./layout";

export interface AdminLayoutOptions {
  title?: string;
  authenticated?: boolean;
}

/**
 * Render a complete HTML5 page with the admin-specific shell.
 *
 * Uses the shared AoC stylesheet but renders a minimal nav
 * ("AIPocalypse Admin" + optional logout link) and no footer.
 */
export function adminLayout(
  content: string,
  options: AdminLayoutOptions = {},
): string {
  const { title = "Admin", authenticated = false } = options;
  const pageTitle = `${title} — AIPocalypse`;

  const logoutLink = authenticated
    ? `<a href="/admin/logout">logout from admin site</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="stylesheet" href="/public/style.css">
</head>
<body>
  <nav>
    <div class="container">
      <a href="/admin" class="site-title">AIPocalypse Admin</a>
      <div class="nav-links">
        ${logoutLink}
      </div>
    </div>
  </nav>
  <main>
    <div class="container">
      ${content}
    </div>
  </main>
</body>
</html>`;
}
