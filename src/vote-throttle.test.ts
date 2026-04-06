import { describe, expect, test } from "bun:test";
import {
  isVoteThrottled,
  recordAcceptedVote,
  resetVoteThrottleForTest,
  VOTE_COOLDOWN_MS,
} from "./vote-throttle";

describe("vote throttle", () => {
  test("returns false when no entry exists", () => {
    resetVoteThrottleForTest();
    expect(isVoteThrottled("user-1", "poll-1", 1_000)).toBe(false);
  });

  test("returns true when request is within cooldown window", () => {
    resetVoteThrottleForTest();
    recordAcceptedVote("user-1", "poll-1", 1_000);
    expect(isVoteThrottled("user-1", "poll-1", 4_000)).toBe(true);
  });

  test("returns false after cooldown window has elapsed", () => {
    resetVoteThrottleForTest();
    recordAcceptedVote("user-1", "poll-1", 1_000);
    expect(isVoteThrottled("user-1", "poll-1", 1_000 + VOTE_COOLDOWN_MS)).toBe(false);
  });

  test("prunes expired entries lazily during access", () => {
    resetVoteThrottleForTest();
    recordAcceptedVote("user-1", "poll-1", 1_000);
    expect(isVoteThrottled("user-2", "poll-2", 1_000 + VOTE_COOLDOWN_MS)).toBe(false);
    expect(isVoteThrottled("user-1", "poll-1", 1_000 + VOTE_COOLDOWN_MS)).toBe(false);
  });

  test("tracks cooldown independently per user and poll", () => {
    resetVoteThrottleForTest();
    recordAcceptedVote("user-1", "poll-1", 1_000);
    expect(isVoteThrottled("user-1", "poll-2", 2_000)).toBe(false);
    expect(isVoteThrottled("user-2", "poll-1", 2_000)).toBe(false);
  });
});
