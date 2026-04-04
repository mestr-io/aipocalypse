import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getEnvOrSecret } from "./config";

const ORIGINAL_ENV = { ...process.env };
const TEST_ROOT = join(tmpdir(), `aipocalypse-config-test-${process.pid}`);

function restoreEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  restoreEnv();
  rmSync(TEST_ROOT, { recursive: true, force: true });
  delete process.env.AIPOCALYPSE_SECRETS_DIR;
});

describe("getEnvOrSecret", () => {
  test("returns env value when set", () => {
    process.env.TEST_SECRET = "env-value";
    expect(getEnvOrSecret("TEST_SECRET", "test_secret")).toBe("env-value");
  });

  test("uses secret file when env is unset", () => {
    mkdirSync(TEST_ROOT, { recursive: true });
    writeFileSync(join(TEST_ROOT, "test_secret"), "file-value\n");
    process.env.AIPOCALYPSE_SECRETS_DIR = TEST_ROOT;

    expect(getEnvOrSecret("TEST_SECRET", "test_secret")).toBe("file-value");
  });

  test("prefers env value over secret file", () => {
    mkdirSync(TEST_ROOT, { recursive: true });
    writeFileSync(join(TEST_ROOT, "test_secret"), "file-value\n");
    process.env.AIPOCALYPSE_SECRETS_DIR = TEST_ROOT;
    process.env.TEST_SECRET = "env-value";

    expect(getEnvOrSecret("TEST_SECRET", "test_secret")).toBe("env-value");
  });

  test("throws clear error when env and secret file are both missing", () => {
    process.env.AIPOCALYPSE_SECRETS_DIR = TEST_ROOT;

    expect(() => getEnvOrSecret("TEST_SECRET", "test_secret", "TEST_SECRET is not set")).toThrow(
      "TEST_SECRET is not set"
    );
  });
});
