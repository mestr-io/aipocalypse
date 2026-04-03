/**
 * Structured JSON-line logger.
 *
 * Writes one JSON object per line to stdout. Designed for consumption by
 * journalctl when running inside a Podman/Quadlet service.
 *
 * Usage:
 *   import { log } from "../lib/logger";
 *   log.info("admin.poll.created", { pollId: "abc", title: "My Poll" });
 */

function info(action: string, meta?: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    level: "info",
    action,
    ...meta,
  };
  console.log(JSON.stringify(entry));
}

export const log = { info } as const;
