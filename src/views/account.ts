import { layout } from "./layout";
import { renderIdentity } from "./identity";
import type { User } from "../db/queries/users";

/**
 * Account management page — data export and deletion.
 */
export function accountPage(user: User): string {
  const content = `
    <h1>Account</h1>

    <p>Your identity: ${renderIdentity(user.hashedId)}</p>

    <h2>Export your data</h2>

    <p>Download everything we store about you as a JSON file.</p>

    <p><a href="/account/export" class="btn">Download my data</a></p>

    <h2 class="section-heading danger">Delete account</h2>

    <p>Permanently delete your account and all your votes. This cannot be undone.</p>

    <form method="POST" action="/account/delete" onsubmit="return confirm('Are you sure? This will permanently delete your account and all your votes.');">
      <button type="submit" class="btn btn-danger">Delete my account</button>
    </form>

    <p class="section-heading"><a href="/auth/logout">Logout</a></p>
  `;

  return layout(content, { title: "Account", user });
}
