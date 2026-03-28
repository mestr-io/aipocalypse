import { layout } from "./layout";
import type { User } from "../db/queries/users";

/**
 * Privacy policy page — GDPR Art. 13/14 transparency.
 */
export function privacyPage(user: User | null = null): string {
  const content = `
    <h1>Privacy</h1>

    <p>AIPocalypse is a community prediction poll about the impact of AI coding tools.
    This page explains exactly what data we store, why, and what you can do about it.</p>

    <h2>What we collect</h2>

    <p>When you sign in with GitHub, we store the following:</p>

    <pre><code>CREATE TABLE users (
  id         TEXT PRIMARY KEY,   -- internal UUID
  hashedId   TEXT NOT NULL,      -- HMAC hash of your GitHub ID
  createdAt  TEXT NOT NULL,      -- when you first signed in
  updatedAt  TEXT NOT NULL       -- last sign-in
);</code></pre>

    <p>We do <strong>not</strong> store your GitHub username, display name, avatar,
    or any other profile information. Your GitHub numeric ID is hashed with a
    server-side secret (HMAC-SHA256) and only the hash is stored. This hash
    is your visual identity on the site, shown as three colored segments.</p>

    <p>When you vote on a poll, we store your vote:</p>

    <pre><code>CREATE TABLE answers (
  id         TEXT PRIMARY KEY,
  userId     TEXT NOT NULL,      -- links to your user record
  pollId     TEXT NOT NULL,      -- which poll
  questionId TEXT NOT NULL,      -- which option you picked
  createdAt  TEXT NOT NULL,
  updatedAt  TEXT NOT NULL
);</code></pre>

    <p>We do <strong>not</strong> store your GitHub access token. It is used once during login
    to fetch your numeric ID for hashing and then discarded.</p>

    <h2>Cookies</h2>

    <table>
      <thead>
        <tr><th>Name</th><th>Purpose</th><th>Lifetime</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><code>aipocalypse_session</code></td>
          <td>Session cookie (httpOnly) — keeps you logged in</td>
          <td>30 days</td>
        </tr>
        <tr>
          <td><code>aipocalypse_oauth_state</code></td>
          <td>CSRF protection during GitHub login (httpOnly)</td>
          <td>10 minutes</td>
        </tr>
      </tbody>
    </table>

    <p>Both cookies are strictly necessary for the site to function. No analytics,
    tracking, or third-party cookies are used.</p>

    <h2>Legal basis</h2>

    <p>We process your data under <strong>Art. 6(1)(b) GDPR</strong> — contract performance.
    Signing in and voting are the core service; we only store what is needed to provide it.</p>

    <h2>Your rights</h2>

    <p>Under GDPR you have the right to:</p>

    <ul>
      <li><strong>Access</strong> — see what data we hold about you</li>
      <li><strong>Export</strong> — download all your data as JSON</li>
      <li><strong>Erasure</strong> — permanently delete your account and all votes</li>
    </ul>

    <p>You can exercise these rights from your <a href="/account">Account page</a> (requires sign-in).</p>

    <h2>Source code</h2>

    <p>This project is open source. You can inspect exactly how your data is handled:<br>
    <a href="https://github.com/mestr-io/aipocalypse">github.com/mestr-io/aipocalypse</a></p>
  `;

  return layout(content, { title: "Privacy", user });
}
