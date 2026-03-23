import { layout, escapeHtml } from "./layout";
import type { ActivePollRow } from "../db/queries/polls";

/**
 * Public home page listing active polls.
 */
export function pollListPage(polls: ActivePollRow[]): string {
  const pollCards =
    polls.length > 0
      ? polls
          .map((p) => {
            const preview =
              p.body.length > 120
                ? escapeHtml(p.body.slice(0, 120)) + "&hellip;"
                : escapeHtml(p.body);

            const dueLabel = p.dueDate
              ? `<span class="dimmed">Due: ${escapeHtml(p.dueDate)}</span>`
              : "";

            return `
          <div class="poll-card">
            <h2><a href="/poll/${escapeHtml(p.id)}">${escapeHtml(p.name)}</a></h2>
            <p class="poll-preview">${preview}</p>
            <div class="poll-meta">
              ${dueLabel}
              <span class="dimmed">${p.voteCount} vote${p.voteCount !== 1 ? "s" : ""}</span>
            </div>
          </div>`;
          })
          .join("")
      : `<p class="dimmed">No active polls right now. Check back soon.</p>`;

  const content = `
    <h1>Welcome to <span class="green">AIPocalypse</span></h1>
    <p>Community predictions on how agentic coding tools will reshape the developer profession.</p>
    <div class="poll-list">
      ${pollCards}
    </div>
  `;

  return layout(content);
}
