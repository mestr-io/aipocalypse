import { appPath } from "../lib/paths";
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

    <p><a href="${appPath("/account/export")}" class="btn">Download my data</a></p>

    <h2 class="section-heading danger">Delete account</h2>

    <p>Permanently delete your account and all your votes. This cannot be undone.</p>

    <form method="POST" action="${appPath("/account/delete")}">
      <div class="delete-slide">
        <input type="checkbox" id="delete-toggle" />
        <div class="delete-slide-track">
          <div class="delete-slide-initial">
            <label for="delete-toggle" class="btn btn-danger">Delete my account</label>
          </div>
          <div class="delete-slide-confirm">
            <label for="delete-toggle" class="btn">No... keep my account</label>
            <button type="submit" class="btn btn-danger">Yes, delete my account</button>
          </div>
        </div>
      </div>
    </form>

    <p class="section-heading"><a href="${appPath("/auth/logout")}">Logout</a></p>
  `;

  return layout(content, { title: "Account", user });
}
