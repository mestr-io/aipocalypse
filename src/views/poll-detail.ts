import { layout, escapeHtml, progressBar } from "./layout";
import type { PollDetail } from "../db/queries/polls";

/**
 * Public poll detail page with AoC-style progress bars.
 */
export function pollDetailPage(poll: PollDetail): string {
  const dueLabel = poll.dueDate
    ? `<p class="dimmed">Due: ${escapeHtml(poll.dueDate)}</p>`
    : "";

  const optionRows = poll.questions
    .map((q) => {
      const percent =
        poll.totalVotes > 0
          ? Math.round((q.voteCount / poll.totalVotes) * 100)
          : 0;

      return `
      <div class="poll-option">
        <div class="option-label">${escapeHtml(q.body)}</div>
        <div class="option-bar">
          [${progressBar(percent)}] <span class="option-percent">${percent}%</span>
        </div>
      </div>`;
    })
    .join("");

  const content = `
    <h1>${escapeHtml(poll.name)}</h1>
    ${dueLabel}
    <div class="poll-body">${escapeHtml(poll.body)}</div>
    <div class="poll-options">
      ${optionRows}
    </div>
    <p class="poll-total dimmed">${poll.totalVotes} vote${poll.totalVotes !== 1 ? "s" : ""}</p>
    <p><a href="/" class="dimmed">&larr; Back to polls</a></p>
  `;

  return layout(content, { title: poll.name });
}
