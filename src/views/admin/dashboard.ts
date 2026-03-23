import { layout } from "../layout";
import { escapeHtml } from "../layout";
import type { PollRow } from "../../db/queries/polls";

/**
 * Admin dashboard page listing all polls.
 */
export function adminDashboardPage(polls: PollRow[]): string {
  const statusBadge = (status: string): string => {
    const cls =
      status === "active" ? "status-active" :
      status === "done" ? "status-done" :
      "status-hidden";
    return `<span class="status ${cls}">[${escapeHtml(status)}]</span>`;
  };

  const pollRows = polls.length > 0
    ? polls.map((p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${statusBadge(p.status)}</td>
          <td>${p.questionCount}</td>
          <td class="dimmed">${p.dueDate || "—"}</td>
          <td class="dimmed">${p.createdAt.slice(0, 10)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5" class="dimmed">No polls yet. <a href="/admin/polls/new">Create one</a>.</td></tr>`;

  const content = `
    <h1>Admin Dashboard</h1>
    <p><a href="/admin/polls/new" class="btn">+ New Poll</a></p>
    <table class="admin-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Options</th>
          <th>Due Date</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        ${pollRows}
      </tbody>
    </table>
    <p style="margin-top: 1rem;"><a href="/admin/logout" class="dimmed">Logout</a></p>
  `;

  return layout(content, { title: "Admin" });
}
