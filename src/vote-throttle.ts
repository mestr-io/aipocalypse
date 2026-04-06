export const VOTE_COOLDOWN_MS = 5_000;

const voteCooldowns = new Map<string, number>();

function makeKey(userId: string, pollId: string): string {
  return `${userId}:${pollId}`;
}

function pruneExpired(nowMs: number): void {
  for (const [key, lastAcceptedAtMs] of voteCooldowns.entries()) {
    if (nowMs - lastAcceptedAtMs >= VOTE_COOLDOWN_MS) {
      voteCooldowns.delete(key);
    }
  }
}

export function isVoteThrottled(userId: string, pollId: string, nowMs: number = Date.now()): boolean {
  pruneExpired(nowMs);
  const lastAcceptedAtMs = voteCooldowns.get(makeKey(userId, pollId));
  if (lastAcceptedAtMs === undefined) {
    return false;
  }

  return nowMs - lastAcceptedAtMs < VOTE_COOLDOWN_MS;
}

export function recordAcceptedVote(userId: string, pollId: string, nowMs: number = Date.now()): void {
  pruneExpired(nowMs);
  voteCooldowns.set(makeKey(userId, pollId), nowMs);
}

export function resetVoteThrottleForTest(): void {
  voteCooldowns.clear();
}
