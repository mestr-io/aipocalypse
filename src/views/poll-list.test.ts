import { test, expect, describe } from "bun:test";
import { pollListPage } from "./poll-list";
import type { ActivePollRow } from "../db/queries/polls";

function makePoll(overrides: Partial<ActivePollRow> = {}): ActivePollRow {
  return {
    id: "poll-1",
    name: "Test Poll",
    body: "A test poll body",
    dueDate: "2026-12-31",
    status: "active",
    links: "",
    createdAt: "2026-01-01",
    voteCount: 5,
    ...overrides,
  };
}

describe("pollListPage poll card links", () => {
  test("renders links on poll card when links field has valid links", () => {
    const links = "[Docs](https://docs.example.com)\n[Blog](https://blog.example.com)";
    const html = pollListPage([makePoll({ links })]);
    expect(html).toContain('<ul class="poll-links">');
    expect(html).toContain(">Docs</a>");
    expect(html).toContain(">Blog</a>");
  });

  test("does not render links section when links field is empty", () => {
    const html = pollListPage([makePoll({ links: "" })]);
    expect(html).not.toContain("poll-links");
  });

  test("links appear between poll-preview and poll-meta", () => {
    const links = "[Reference](https://example.com)";
    const html = pollListPage([makePoll({ links })]);
    const previewIndex = html.indexOf("poll-preview");
    const linksIndex = html.indexOf("poll-links");
    const metaIndex = html.indexOf("poll-meta");
    expect(previewIndex).toBeGreaterThan(-1);
    expect(linksIndex).toBeGreaterThan(-1);
    expect(metaIndex).toBeGreaterThan(-1);
    expect(linksIndex).toBeGreaterThan(previewIndex);
    expect(linksIndex).toBeLessThan(metaIndex);
  });

  test("does not render links section for malformed links", () => {
    const html = pollListPage([makePoll({ links: "just text\nno links" })]);
    expect(html).not.toContain("poll-links");
  });

  test("links open in new tab with noopener noreferrer", () => {
    const links = "[Link](https://example.com)";
    const html = pollListPage([makePoll({ links })]);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
