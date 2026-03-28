import { layout } from "../layout";
import { escapeHtml } from "../layout";

export interface AnswerValue {
  id?: string;
  text: string;
}

export interface PollFormValues {
  title: string;
  body: string;
  dueDate: string;
  status: string;
  links: string;
  answers: AnswerValue[];
}

export interface PollFormOptions {
  error?: string;
  values?: PollFormValues;
  pollId?: string;
}

const DEFAULT_VALUES: PollFormValues = {
  title: "",
  body: "",
  dueDate: "",
  status: "hidden",
  links: "",
  answers: [{ text: "" }, { text: "" }],
};

/**
 * Admin poll creation form with dynamic answer rows.
 */
export function adminPollFormPage(options: PollFormOptions = {}): string {
  const { error, values = DEFAULT_VALUES, pollId } = options;
  const isEdit = !!pollId;
  const answers = values.answers.length >= 2 ? values.answers : [{ text: "" }, { text: "" }];

  const errorHtml = error
    ? `<div class="admin-error">${escapeHtml(error)}</div>`
    : "";

  const statusOptions = ["hidden", "active", "done"]
    .map(
      (s) =>
        `<option value="${s}"${s === values.status ? " selected" : ""}>${s}</option>`
    )
    .join("");

  const answerRows = answers
    .map(
      (a, i) => `
      <div class="answer-row">
        <input type="hidden" name="answerIds[]" value="${a.id ? escapeHtml(a.id) : ""}">
        <input type="text" name="answers[]" value="${escapeHtml(a.text)}" placeholder="Option ${i + 1}">
        <button type="button" class="btn btn-remove" onclick="removeAnswer(this)">Remove</button>
      </div>`
    )
    .join("");

  const pageTitle = isEdit ? "Edit Poll" : "New Poll";
  const formAction = isEdit ? `/admin/polls/${pollId}` : "/admin/polls";
  const submitLabel = isEdit ? "Update Poll" : "Create Poll";

  const content = `
    <h1>${pageTitle}</h1>
    ${errorHtml}
    <form method="POST" action="${formAction}" class="admin-form">
      <div class="form-group">
        <label for="title">Title</label>
        <input type="text" id="title" name="title" value="${escapeHtml(values.title)}" required>
      </div>
      <div class="form-group">
        <label for="body">Description</label>
        <textarea id="body" name="body" rows="3">${escapeHtml(values.body)}</textarea>
      </div>
      <div class="form-group">
        <label for="dueDate">Due Date</label>
        <input type="date" id="dueDate" name="dueDate" value="${escapeHtml(values.dueDate)}">
      </div>
      <div class="form-group">
        <label for="status">Status</label>
        <select id="status" name="status">${statusOptions}</select>
      </div>
      <div class="form-group">
        <label for="links">Context Links <span class="admin-dimmed">(one per line)</span></label>
        <textarea id="links" name="links" rows="4" placeholder="[Article title](https://example.com/article)&#10;[Report name](https://example.com/report)">${escapeHtml(values.links)}</textarea>
      </div>
      <div class="form-group">
        <label>Answer Options <span class="admin-dimmed">(min 2)</span></label>
        <div id="answers-container">
          ${answerRows}
        </div>
        <button type="button" class="btn" onclick="addAnswer()" style="margin-top: 0.5rem;">+ Add Option</button>
      </div>
      <div class="form-group" style="margin-top: 1.5rem;">
        <button type="submit">${submitLabel}</button>
        <a href="/admin" class="admin-dimmed" style="margin-left: 1rem;">Cancel</a>
      </div>
    </form>

    <script>
      function addAnswer() {
        var container = document.getElementById('answers-container');
        var count = container.querySelectorAll('.answer-row').length;
        var div = document.createElement('div');
        div.className = 'answer-row';
        div.innerHTML = '<input type="hidden" name="answerIds[]" value="">' +
          '<input type="text" name="answers[]" placeholder="Option ' + (count + 1) + '">' +
          '<button type="button" class="btn btn-remove" onclick="removeAnswer(this)">Remove</button>';
        container.appendChild(div);
        updateRemoveButtons();
      }

      function removeAnswer(btn) {
        var container = document.getElementById('answers-container');
        var rows = container.querySelectorAll('.answer-row');
        if (rows.length <= 2) return;
        btn.parentElement.remove();
        updateRemoveButtons();
      }

      function updateRemoveButtons() {
        var container = document.getElementById('answers-container');
        var rows = container.querySelectorAll('.answer-row');
        var buttons = container.querySelectorAll('.btn-remove');
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].disabled = rows.length <= 2;
          buttons[i].style.opacity = rows.length <= 2 ? '0.3' : '1';
        }
      }

      updateRemoveButtons();
    </script>
  `;

  return layout(content, { title: pageTitle });
}
