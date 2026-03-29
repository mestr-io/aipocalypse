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

describe("pollListPage", () => {
  test("poll card does not render context links", () => {
    const links = "[Docs](https://docs.example.com)\n[Blog](https://blog.example.com)";
    const html = pollListPage([makePoll({ links })]);
    expect(html).not.toContain("poll-links");
    expect(html).not.toContain("Related info:");
  });

  test("renders voted badge when poll is in votedPollIds", () => {
    const poll = makePoll({ id: "poll-1" });
    const html = pollListPage([poll], null, new Set(["poll-1"]));
    expect(html).toContain('<span class="voted-badge">[voted]</span>');
  });

  test("does not render voted badge when poll is not in votedPollIds", () => {
    const poll = makePoll({ id: "poll-1" });
    const html = pollListPage([poll], null, new Set(["poll-other"]));
    expect(html).not.toContain("voted-badge");
  });

  test("does not render voted badge when no votedPollIds passed", () => {
    const poll = makePoll({ id: "poll-1" });
    const html = pollListPage([poll]);
    expect(html).not.toContain("voted-badge");
  });

  test("voted badge appears in poll-meta row", () => {
    const poll = makePoll({ id: "poll-1" });
    const html = pollListPage([poll], null, new Set(["poll-1"]));
    const metaIndex = html.indexOf("poll-meta");
    const badgeIndex = html.indexOf("voted-badge");
    expect(metaIndex).toBeGreaterThan(-1);
    expect(badgeIndex).toBeGreaterThan(-1);
    expect(badgeIndex).toBeGreaterThan(metaIndex);
  });

  test("voted badge shown on done polls too", () => {
    const poll = makePoll({ id: "poll-done", status: "done" });
    const html = pollListPage([poll], null, new Set(["poll-done"]));
    expect(html).toContain("voted-badge");
  });
});
