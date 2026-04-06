import { appPath } from "../lib/paths";
import { layout } from "./layout";
import type { User } from "../db/queries/users";

/**
 * Privacy page — concise transparency notice.
 */
export function privacyPage(user: User | null = null): string {
  const content = `
    <h1>Privacy</h1>

    <p>AIPocalypse stores the minimum data needed to run a GitHub-authenticated polling site,
    prevent duplicate voting per account, and let you export or delete your data later.</p>

    <h2>What we store</h2>

    <p>When you sign in with GitHub, we create a one-way hash of your GitHub numeric ID.
    This hash is your pseudonymous identity on the site, displayed as a short code like
    <span class="green">a7f3b2-c1e9d0-4f8baa</span>.</p>

    <p>We store that hashed identity, your poll votes, and the related timestamps needed to
    show results and honor data export/deletion requests.</p>

    <p>We also keep a small amount of security logging for significant actions such as logins,
    vote submissions, data export, account deletion, and rejected security checks.</p>

    <p>We do <strong>not</strong> store your GitHub username, display name, avatar,
    email address, or GitHub access token. The GitHub token is used once during login
    to fetch your numeric ID for hashing and is then discarded.</p>

    <h2>Cookies</h2>

    <p><code>aipocalypse_session</code> keeps you logged in as a user for about 30 days.
    <code>aipocalypse_oauth_state</code> is a short-lived login security cookie used during
    the GitHub OAuth flow. <code>admin_session</code> is used only after a successful admin login.
    No analytics, tracking, or third-party cookies are used.</p>

    <h2>Your rights</h2>

    <p>You have the right to access, export, or permanently delete your data.
    You can do all of this from your <a href="${appPath("/account")}">Account page</a> (requires sign-in).</p>

    <h2>Source code</h2>

    <p>This project is open source. You can inspect exactly how your data is handled:<br>
    <a href="https://github.com/mestr-io/aipocalypse">github.com/mestr-io/aipocalypse</a></p>
  `;

  return layout(content, { title: "Privacy", user });
}
