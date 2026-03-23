import { layout } from "../layout";
import { escapeHtml } from "../layout";

export interface PollFormValues {
  title: string;
  body: string;
  dueDate: string;
  status: string;
  answers: string[];
}

export interface PollFormOptions {
  error?: string;
  values?: PollFormValues;
}

const DEFAULT_VALUES: PollFormValues = {
  title: "",
  body: "",
  dueDate: "",
  status: "hidden",
  answers: ["", ""],
};

/**
 * Admin poll creation form with dynamic answer rows.
 */
export function adminPollFormPage(options: PollFormOptions = {}): string {
  const { error, values = DEFAULT_VALUES } = options;
  const answers = values.answers.length >= 2 ? values.answers : ["", ""];

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
        <input type="text" name="answers[]" value="${escapeHtml(a)}" placeholder="Option ${i + 1}">
        <button type="button" class="btn btn-remove" onclick="removeAnswer(this)">Remove</button>
      </div>`
    )
    .join("");

  const content = `
    <h1>New Poll</h1>
    ${errorHtml}
    <form method="POST" action="/admin/polls" class="admin-form">
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
        <label>Answer Options <span class="dimmed">(min 2)</span></label>
        <div id="answers-container">
          ${answerRows}
        </div>
        <button type="button" class="btn" onclick="addAnswer()" style="margin-top: 0.5rem;">+ Add Option</button>
      </div>
      <div class="form-group" style="margin-top: 1.5rem;">
        <button type="submit">Create Poll</button>
        <a href="/admin" class="dimmed" style="margin-left: 1rem;">Cancel</a>
      </div>
    </form>

    <script>
      function addAnswer() {
        var container = document.getElementById('answers-container');
        var count = container.querySelectorAll('.answer-row').length;
        var div = document.createElement('div');
        div.className = 'answer-row';
        div.innerHTML = '<input type="text" name="answers[]" placeholder="Option ' + (count + 1) + '">' +
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

  return layout(content, { title: "New Poll" });
}
