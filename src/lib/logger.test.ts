import { describe, test, expect, spyOn, afterEach } from "bun:test";
import { log } from "./logger";

describe("logger", () => {
  const spy = spyOn(console, "log");

  afterEach(() => {
    spy.mockClear();
  });

  test("info() writes a valid JSON line with ts, level, and action", () => {
    log.info("test.action");

    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);

    expect(parsed.level).toBe("info");
    expect(parsed.action).toBe("test.action");
    expect(typeof parsed.ts).toBe("string");
    // ts should be a valid ISO 8601 date
    expect(Number.isNaN(Date.parse(parsed.ts))).toBe(false);
  });

  test("info() spreads metadata into top-level fields", () => {
    log.info("admin.poll.created", { pollId: "abc123", title: "Test" });

    const output = spy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);

    expect(parsed.action).toBe("admin.poll.created");
    expect(parsed.pollId).toBe("abc123");
    expect(parsed.title).toBe("Test");
  });

  test("info() with no metadata only contains ts, level, action", () => {
    log.info("auth.logout");

    const output = spy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);

    expect(Object.keys(parsed).sort()).toEqual(["action", "level", "ts"]);
  });
});
