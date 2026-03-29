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
});
