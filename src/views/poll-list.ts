import { layout, escapeHtml } from "./layout";
import { renderLinks } from "./poll-detail";
import type { ActivePollRow } from "../db/queries/polls";
import type { User } from "../db/queries/users";

/**
 * Public home page listing polls (active + done).
 */
export function pollListPage(
  polls: ActivePollRow[],
  user: User | null = null
): string {
  const activePolls = polls.filter((p) => p.status === "active");
  const donePolls = polls.filter((p) => p.status === "done");

  const renderCard = (p: ActivePollRow): string => {
    const preview =
      p.body.length > 120
        ? escapeHtml(p.body.slice(0, 120)) + "&hellip;"
        : escapeHtml(p.body);

    const dueLabel = p.dueDate
      ? `<span class="dimmed">Due: ${escapeHtml(p.dueDate)}</span>`
      : "";

    const statusBadge =
      p.status === "done"
        ? `<span class="status status-done">Sealed</span>`
        : "";

    return `
      <div class="poll-card">
        <h2><a href="/poll/${escapeHtml(p.id)}">${escapeHtml(p.name)}</a> ${statusBadge}</h2>
        <p class="poll-preview">${preview}</p>
        ${renderLinks(p.links)}
        <div class="poll-meta">
          ${dueLabel}
          <span class="dimmed">${p.voteCount} vote${p.voteCount !== 1 ? "s" : ""}</span>
        </div>
      </div>`;
  };

  const activePollsHtml =
    activePolls.length > 0
      ? activePolls.map(renderCard).join("")
      : `<p class="dimmed">No active predictions right now. New questions drop regularly.</p>`;

  const donePollsHtml =
    donePolls.length > 0
      ? `
        <h2 class="section-heading dimmed">Past Predictions</h2>
        ${donePolls.map(renderCard).join("")}`
      : "";

  const content = `
    <h1>Welcome to <span class="green">AIPocalypse</span></h1>
    <p>Will AI agents replace us, augment us, or just mass-produce mediocre code? Cast your predictions before reality catches up.</p>
    <div class="poll-list">
      ${activePollsHtml}
    </div>
    ${donePollsHtml}
  `;

  return layout(content, { user });
}
