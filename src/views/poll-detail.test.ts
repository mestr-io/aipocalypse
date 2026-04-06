import { test, expect, describe } from "bun:test";
import { renderLinks, pollDetailPage } from "./poll-detail";
import type { PollDetail } from "../db/queries/polls";
import type { User } from "../db/queries/users";

describe("renderLinks", () => {
  test("returns empty string for empty input", () => {
    expect(renderLinks("")).toBe("");
  });

  test("returns empty string for whitespace-only input", () => {
    expect(renderLinks("   \n  ")).toBe("");
  });

  test("parses a single valid link", () => {
    const html = renderLinks("[My Article](https://example.com/article)");
    expect(html).toContain('<a href="https://example.com/article"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain(">My Article</a>");
  });

  test("parses multiple links on separate lines", () => {
    const input = [
      "[First Link](https://example.com/1)",
      "[Second Link](https://example.com/2)",
      "[Third Link](http://example.com/3)",
    ].join("\n");

    const html = renderLinks(input);
    expect(html).toContain(">First Link</a>");
    expect(html).toContain(">Second Link</a>");
    expect(html).toContain(">Third Link</a>");
    // Should be wrapped in a section div with label
    expect(html).toStartWith('<div class="poll-links-section">');
    expect(html).toContain("Related info:");
    expect(html).toEndWith("</ul></div>");
  });

  test("ignores lines that do not match [Label](url) format", () => {
    const input = [
      "Just some plain text",
      "[Valid Link](https://example.com)",
      "Another random line",
      "not a [link] at all",
    ].join("\n");

    const html = renderLinks(input);
    expect(html).toContain(">Valid Link</a>");
    // Should only have one <li>
    const liCount = (html.match(/<li>/g) || []).length;
    expect(liCount).toBe(1);
  });

  test("ignores links without http/https protocol", () => {
    const input = "[Bad Link](ftp://example.com/file)";
    const html = renderLinks(input);
    expect(html).toBe("");
  });

  test("returns empty string when all lines are malformed", () => {
    const input = ["no links here", "still nothing", "nope"].join("\n");
    expect(renderLinks(input)).toBe("");
  });

  test("escapes HTML in label text to prevent XSS", () => {
    const input = '[<script>alert("xss")</script>](https://example.com)';
    const html = renderLinks(input);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("escapes HTML in URL to prevent XSS", () => {
    const input = '[Link](https://example.com/page?q=a"onmouseover="alert(1))';
    const html = renderLinks(input);
    expect(html).toContain("&quot;");
    expect(html).not.toContain('onmouseover="alert');
  });

  test("handles mixed valid and invalid links", () => {
    const input = [
      "Some context text",
      "[Good Link](https://example.com)",
      "random line",
      "[Another Good](https://other.com/page)",
    ].join("\n");

    const html = renderLinks(input);
    const liCount = (html.match(/<li>/g) || []).length;
    expect(liCount).toBe(2);
  });

  test("all links have target=_blank and rel=noopener noreferrer", () => {
    const input = [
      "[Link 1](https://a.com)",
      "[Link 2](https://b.com)",
    ].join("\n");

    const html = renderLinks(input);
    const targetCount = (html.match(/target="_blank"/g) || []).length;
    const relCount = (html.match(/rel="noopener noreferrer"/g) || []).length;
    expect(targetCount).toBe(2);
    expect(relCount).toBe(2);
  });

  test("links are wrapped in poll-links class for dimmed styling", () => {
    const html = renderLinks("[Link](https://example.com)");
    expect(html).toContain('<ul class="poll-links">');
    expect(html).toContain('<div class="poll-links-section">');
    // Links are <a> inside .poll-links, so .poll-links a CSS rule applies
    expect(html).toMatch(/<ul class="poll-links">.*<a href=.*<\/a>.*<\/ul>/s);
  });
});

// Helper to build a minimal PollDetail fixture
function makePoll(overrides: Partial<PollDetail> = {}): PollDetail {
  return {
    id: "poll-1",
    name: "Test Poll",
    body: "A test poll body",
    dueDate: "2026-12-31",
    status: "active",
    links: "",
    createdAt: "2026-01-01",
    questions: [
      { id: "q-1", body: "Option A", position: 0, voteCount: 5 },
      { id: "q-2", body: "Option B", position: 1, voteCount: 3 },
    ],
    totalVotes: 8,
    ...overrides,
  };
}

const testUser: User = {
  id: "user-1",
  hashedId: "a7f3b2c1e9d04f8baa",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("pollDetailPage", () => {
  test("renders without links when links field is empty", () => {
    const html = pollDetailPage(makePoll({ links: "" }));
    expect(html).not.toContain("poll-links");
    expect(html).toContain("Test Poll");
    expect(html).toContain("Option A");
    expect(html).toContain("Option B");
  });

  test("renders links section when links field has valid links", () => {
    const links = "[Docs](https://docs.example.com)\n[Blog](https://blog.example.com)";
    const html = pollDetailPage(makePoll({ links }));
    expect(html).toContain('<ul class="poll-links">');
    expect(html).toContain(">Docs</a>");
    expect(html).toContain(">Blog</a>");
  });

  test("links section appears after poll-total", () => {
    const links = "[Reference](https://example.com)";
    const html = pollDetailPage(makePoll({ links }));
    const totalIndex = html.indexOf("poll-total");
    const linksIndex = html.indexOf("poll-links");
    expect(totalIndex).toBeGreaterThan(-1);
    expect(linksIndex).toBeGreaterThan(-1);
    expect(linksIndex).toBeGreaterThan(totalIndex);
  });

  test("links section appears before back link", () => {
    const links = "[Reference](https://example.com)";
    const html = pollDetailPage(makePoll({ links }));
    const linksIndex = html.indexOf("poll-links");
    const backIndex = html.indexOf("Back to predictions");
    expect(linksIndex).toBeGreaterThan(-1);
    expect(backIndex).toBeGreaterThan(-1);
    expect(linksIndex).toBeLessThan(backIndex);
  });

  test("no links section when links contain only malformed lines", () => {
    const html = pollDetailPage(makePoll({ links: "just some text\nno links here" }));
    expect(html).not.toContain("poll-links");
  });

  test("renders page title from poll name", () => {
    const html = pollDetailPage(makePoll({ name: "AI Impact 2026" }));
    expect(html).toContain("AI Impact 2026");
  });

  test("renders csrf token in vote form for authenticated users", () => {
    const html = pollDetailPage(makePoll(), testUser, null, "csrf-token-123");
    expect(html).toContain('name="csrfToken"');
    expect(html).toContain('value="csrf-token-123"');
  });

  test("does not render vote form csrf token for logged-out users", () => {
    const html = pollDetailPage(makePoll(), null, null, "csrf-token-123");
    expect(html).not.toContain('name="csrfToken"');
  });
});
