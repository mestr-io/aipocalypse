import { appPath } from "../../lib/paths";
import { adminLayout } from "../admin-layout";
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
    ? polls.map((p) => {
        const isDeleted = !!p.deletedAt;
        const rowClass = isDeleted ? ' class="deleted-row"' : '';
        const titleCell = isDeleted
          ? `<span class="poll-title-deleted">${escapeHtml(p.name)}</span>`
          : `<a href="${appPath(`/admin/polls/${p.id}/edit`)}">${escapeHtml(p.name)}</a>`;
        const statusCell = isDeleted
          ? `<span class="status status-deleted">[deleted]</span>`
          : statusBadge(p.status);

        return `
        <tr${rowClass}>
          <td>${titleCell}</td>
          <td>${statusCell}</td>
          <td>${p.questionCount}</td>
          <td class="admin-dimmed">${p.dueDate || "—"}</td>
          <td class="admin-dimmed">${p.createdAt.slice(0, 10)}</td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="5" class="admin-dimmed">No polls yet. <a href="${appPath("/admin/polls/new")}">Create one</a>.</td></tr>`;

  const content = `
    <h1>Admin Dashboard</h1>
    <p><a href="${appPath("/admin/polls/new")}" class="btn">+ New Poll</a></p>
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
  `;

  return adminLayout(content, { title: "Admin", authenticated: true });
}
