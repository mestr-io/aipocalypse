## Context

Polls currently have `name`, `body`, `dueDate`, and `status` fields. The poll detail page renders the title, body, due date, voting options, and vote counts. There is no mechanism to attach external reference links to a poll. Admins create/edit polls via a form at `/admin/polls/new` and `/admin/polls/:id/edit`.

The `links` field needs to integrate with the existing poll CRUD pipeline: admin form input, route parsing, database persistence, query retrieval, and public view rendering.

## Goals / Non-Goals

**Goals:**
- Allow admins to attach a list of context links to any poll
- Display links on the poll detail page between the body and the voting options
- Links open in a new browser tab
- Links use markdown-style `[Label](url)` format for admin input
- Backward-compatible migration — existing polls get an empty string default

**Non-Goals:**
- Link validation or URL reachability checking
- Rich markdown rendering beyond simple `[Label](url)` link extraction
- Links on the poll list/home page (detail page only)
- User-submitted links — admin-only
- Link click analytics or tracking

## Decisions

### Store links as plain text, not a separate table

**Decision**: Add a single `links TEXT NOT NULL DEFAULT ''` column to the `polls` table rather than a separate `poll_links` join table.

**Rationale**: Links are simple metadata attached 1:1 to a poll. A separate table adds join complexity, migration overhead, and CRUD boilerplate for what is essentially a text blob. The markdown format (`[Label](url)`, one per line) is human-readable in the admin form and trivially parseable at render time.

**Alternative considered**: Separate `poll_links` table with `pollId`, `label`, `url`, `position` columns. Rejected — over-engineered for a display-only feature with no need for individual link queries, ordering changes, or referential integrity.

### Parse links at render time, not at write time

**Decision**: Store the raw markdown text as-is and parse `[Label](url)` patterns when rendering the poll detail page.

**Rationale**: Keeps the write path simple (just store the string). Parsing is trivial with a regex. If the format ever changes, only the renderer needs updating — no data migration required.

### Render links as a simple list, not inline markdown

**Decision**: Extract `[Label](url)` entries and render each as an `<a>` tag in a `<ul>` list, rather than using a full markdown parser.

**Rationale**: The project has no markdown dependency and adding one for this single feature is overkill. A focused regex (`/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g`) handles the use case precisely.

### Use `target="_blank"` with `rel="noopener noreferrer"`

**Decision**: All context links open in a new tab with security attributes.

**Rationale**: Standard security practice for external links. Prevents the opened page from accessing `window.opener`.

## Risks / Trade-offs

- **[Malformed input]** Admin could enter links in wrong format. Mitigation: Non-matching lines are silently ignored. The textarea placeholder shows the expected format. This is admin-only input.
- **[XSS via link content]** Labels and URLs come from admin input. Mitigation: Both label text and URL href are HTML-escaped before rendering, same as all other user content in the app.
- **[Large text blob]** No size limit on the links field. Mitigation: Acceptable for admin-only input; polls rarely need more than 5-10 links.
