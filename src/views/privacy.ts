import { layout } from "./layout";
import type { User } from "../db/queries/users";

/**
 * Privacy page — concise transparency notice.
 */
export function privacyPage(user: User | null = null): string {
  const content = `
    <h1>Privacy</h1>

    <p>AIPocalypse is a community prediction poll about the impact of AI coding tools.
    Here is what we store and why.</p>

    <h2>What we store</h2>

    <p>When you sign in with GitHub, we create a one-way hash of your GitHub numeric ID.
    This hash is your anonymous identity on the site, displayed as a short code like
    <span class="green">a7f3b2-c1e9d0-4f8baa</span>.</p>

    <p>We do <strong>not</strong> store your GitHub username, display name, avatar,
    email, or access token. Your GitHub token is used once during login to fetch
    your numeric ID for hashing and is then discarded.</p>

    <p>When you vote on a poll, we store your vote linked to your hashed identity.</p>

    <p>A session cookie (<code>aipocalypse_session</code>) keeps you logged in for 30 days.
    No analytics, tracking, or third-party cookies are used.</p>

    <h2>Your rights</h2>

    <p>You have the right to access, export, or permanently delete your data.
    You can do all of this from your <a href="/account">Account page</a> (requires sign-in).</p>

    <h2>Source code</h2>

    <p>This project is open source. You can inspect exactly how your data is handled:<br>
    <a href="https://github.com/mestr-io/aipocalypse">github.com/mestr-io/aipocalypse</a></p>
  `;

  return layout(content, { title: "Privacy", user });
}
