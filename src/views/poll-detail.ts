import { layout, escapeHtml, progressBar } from "./layout";
import type { PollDetail } from "../db/queries/polls";
import type { User } from "../db/queries/users";

/**
 * Public poll detail page with AoC-style progress bars and voting form.
 */
export function pollDetailPage(
  poll: PollDetail,
  user: User | null = null,
  userVote: string | null = null
): string {
  const dueLabel = poll.dueDate
    ? `<p class="dimmed">Due: ${escapeHtml(poll.dueDate)}</p>`
    : "";

  const isActive = poll.status === "active";
  const canVote = isActive && !!user;
  const hasVoted = !!userVote;

  const optionRows = poll.questions
    .map((q) => {
      const percent =
        poll.totalVotes > 0
          ? Math.round((q.voteCount / poll.totalVotes) * 100)
          : 0;

      const isSelected = userVote === q.id;
      const selectedClass = isSelected ? " voted" : "";
      const selectedMarker = isSelected
        ? `<span class="vote-marker gold">&#9654;</span> `
        : "";

      // If user can vote, show radio buttons
      const radioInput = canVote
        ? `<input type="radio" name="questionId" value="${escapeHtml(q.id)}"${isSelected ? " checked" : ""} id="q-${escapeHtml(q.id)}">`
        : "";

      const labelTag = canVote
        ? `<label for="q-${escapeHtml(q.id)}" class="option-label${selectedClass}">${selectedMarker}${escapeHtml(q.body)}</label>`
        : `<div class="option-label${selectedClass}">${selectedMarker}${escapeHtml(q.body)}</div>`;

      return `
      <div class="poll-option${selectedClass}">
        ${radioInput}
        <div class="option-content">
          ${labelTag}
          <div class="option-bar">
            ${progressBar(percent)} <span class="option-percent">${percent}%</span> <span class="dimmed">(${q.voteCount})</span>
          </div>
        </div>
      </div>`;
    })
    .join("");

  // Voting form wrapper (only if user can vote)
  const formOpen = canVote
    ? `<form method="POST" action="/vote/${escapeHtml(poll.id)}" class="vote-form">`
    : "";
  const formClose = canVote
    ? `<div class="vote-submit">
        <button type="submit">${hasVoted ? "Change Vote" : "Cast Vote"}</button>
      </div></form>`
    : "";

  // Auth prompt if not logged in and poll is active
  const authPrompt =
    isActive && !user
      ? `<div class="auth-prompt">
           <a href="/auth/login">Sign in with GitHub</a> to cast your vote
         </div>`
      : "";

  // Vote confirmation message
  const voteMessage = hasVoted
    ? `<p class="vote-message dimmed">You have voted on this poll. You can change your vote anytime.</p>`
    : "";

  // Status label for non-active polls
  const statusLabel =
    poll.status === "done"
      ? `<p class="poll-status"><span class="status status-done">Closed</span></p>`
      : "";

  const content = `
    <h1>${escapeHtml(poll.name)}</h1>
    ${statusLabel}
    ${dueLabel}
    <div class="poll-body">${escapeHtml(poll.body)}</div>
    ${authPrompt}
    ${formOpen}
    <div class="poll-options">
      ${optionRows}
    </div>
    ${formClose}
    ${voteMessage}
    <p class="poll-total dimmed">${poll.totalVotes} vote${poll.totalVotes !== 1 ? "s" : ""}</p>
    <p><a href="/" class="dimmed">&larr; Back to polls</a></p>
  `;

  return layout(content, { title: poll.name, user });
}
