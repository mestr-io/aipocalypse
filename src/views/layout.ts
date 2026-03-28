import type { User } from "../db/queries/users";
import { renderIdentity } from "./identity";

export interface LayoutOptions {
  title?: string;
  user?: User | null;
}

/**
 * Render a complete HTML5 page with the AoC-inspired shell.
 *
 * @param content - HTML string for the main content area
 * @param options - page title and optional authenticated user
 */
export function layout(content: string, options: LayoutOptions = {}): string {
  const { title = "AIPocalypse", user = null } = options;
  const pageTitle = title === "AIPocalypse" ? title : `${title} — AIPocalypse`;

  const authSection = user
    ? `${renderIdentity(user.hashedId)} <span class="nav-sep">|</span> <a href="/auth/logout">Logout</a>`
    : `<a href="/auth/login">Sign in with GitHub</a> <span class="dimmed login-notice">(<a href="/privacy">we store minimal data</a>)</span>`;

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
      <a href="/" class="site-title">AIPocalypse</a>
      <div class="nav-links">
        ${authSection}
      </div>
    </div>
  </nav>
  <main>
    <div class="container">
      ${content}
    </div>
  </main>
  <footer>
    <div class="container">
      <span class="dimmed">AIPocalypse — placing bets on the future of code</span>
      <span class="dimmed"> | <a href="/privacy">Privacy</a></span>
    </div>
  </footer>
</body>
</html>`;
}

/**
 * Build an AoC-style progress bar: [*******     ]
 *
 * @param percent - 0 to 100
 * @param width - total character width inside brackets (default 20)
 */
export function progressBar(percent: number, width: number = 20): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;

  const stars = "*".repeat(filled);
  const spaces = " ".repeat(empty);

  return `<span class="progress-bar"><span class="filled">${stars}</span><span class="empty">${spaces}</span></span>`;
}

/**
 * Escape HTML special characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
