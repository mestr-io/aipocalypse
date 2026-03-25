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

      const isCurrent = userVote === q.id;
      const currentClass = isCurrent ? " option-current" : "";

      // Clickable options when user can vote
      const interactiveAttrs = canVote
        ? ` data-question-id="${escapeHtml(q.id)}" tabindex="0" role="option"`
        : "";

      return `
      <div class="poll-option${currentClass}"${interactiveAttrs}>
        <div class="option-content">
          <div class="option-label">${escapeHtml(q.body)}</div>
          <div class="option-bar">
            ${progressBar(percent)} <span class="option-percent">${percent}%</span> <span class="dimmed">(${q.voteCount})</span>
          </div>
        </div>
      </div>`;
    })
    .join("");

  // Voting form wrapper (only if user can vote)
  const currentVoteId = userVote ? escapeHtml(userVote) : "";
  const formOpen = canVote
    ? `<form method="POST" action="/vote/${escapeHtml(poll.id)}" class="vote-form" data-current-vote="${currentVoteId}">
       <input type="hidden" name="questionId" value="${currentVoteId}">`
    : "";
  const formClose = canVote
    ? `<div class="vote-submit">
        <button type="submit">${hasVoted ? "Change Prediction" : "Lock In"}</button>
      </div></form>`
    : "";

  // Inline script for vote selection (only when user can vote)
  const voteScript = canVote
    ? `<script>
(function() {
  var form = document.querySelector('.vote-form');
  if (!form) return;
  var hiddenInput = form.querySelector('input[name="questionId"]');
  var btn = form.querySelector('button[type="submit"]');
  var currentVote = form.dataset.currentVote || '';
  var options = form.querySelectorAll('.poll-option[data-question-id]');

  // Disable button on load if user has a current vote (or no selection yet)
  if (currentVote || !hiddenInput.value) {
    btn.disabled = true;
  }

  function selectOption(el) {
    var qid = el.dataset.questionId;
    // Update hidden input
    hiddenInput.value = qid;
    // Toggle selected class
    options.forEach(function(o) { o.classList.remove('option-selected'); });
    if (qid !== currentVote) {
      el.classList.add('option-selected');
    }
    // Enable/disable button
    btn.disabled = (qid === currentVote);
  }

  options.forEach(function(opt) {
    opt.addEventListener('click', function() { selectOption(opt); });
    opt.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectOption(opt);
      }
    });
  });
})();
</script>`
    : "";

  // Auth prompt if not logged in and poll is active
  const authPrompt =
    isActive && !user
      ? `<div class="auth-prompt">
           <a href="/auth/login">Sign in with GitHub</a> to place your bet
         </div>`
      : "";

  // Vote confirmation message
  const voteMessage = hasVoted
    ? `<p class="vote-message dimmed">Your prediction is locked in. Change it anytime before the deadline.</p>`
    : "";

  // Status label for non-active polls
  const statusLabel =
    poll.status === "done"
      ? `<p class="poll-status"><span class="status status-done">Sealed</span></p>`
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
    ${voteScript}
    <p class="poll-total dimmed">${poll.totalVotes} vote${poll.totalVotes !== 1 ? "s" : ""}</p>
    <p><a href="/" class="dimmed">&larr; Back to predictions</a></p>
  `;

  return layout(content, { title: poll.name, user });
}
