import { afterEach, describe, expect, test } from "bun:test";
import { absoluteAppUrl, appPath, normalizeAppBasePathForTest } from "./paths";

const ORIGINAL_APP_BASE_PATH = process.env.APP_BASE_PATH;

afterEach(() => {
  if (ORIGINAL_APP_BASE_PATH === undefined) {
    delete process.env.APP_BASE_PATH;
  } else {
    process.env.APP_BASE_PATH = ORIGINAL_APP_BASE_PATH;
  }
});

describe("normalizeAppBasePathForTest", () => {
  test("returns empty string for unset or root values", () => {
    expect(normalizeAppBasePathForTest(undefined)).toBe("");
    expect(normalizeAppBasePathForTest("")).toBe("");
    expect(normalizeAppBasePathForTest("/")).toBe("");
  });

  test("adds missing leading slash", () => {
    expect(normalizeAppBasePathForTest("aipocalypse")).toBe("/aipocalypse");
  });

  test("removes trailing slash", () => {
    expect(normalizeAppBasePathForTest("/aipocalypse/")).toBe("/aipocalypse");
  });
});

describe("appPath", () => {
  test("returns root-relative path when APP_BASE_PATH is unset", () => {
    delete process.env.APP_BASE_PATH;
    expect(appPath("/auth/login")).toBe("/auth/login");
    expect(appPath("privacy")).toBe("/privacy");
  });

  test("prefixes paths when APP_BASE_PATH is set", () => {
    process.env.APP_BASE_PATH = "/aipocalypse";
    expect(appPath("/auth/login")).toBe("/aipocalypse/auth/login");
    expect(appPath("privacy")).toBe("/aipocalypse/privacy");
    expect(appPath("/")).toBe("/aipocalypse");
  });
});

describe("absoluteAppUrl", () => {
  test("builds absolute callback URLs with base path", () => {
    process.env.APP_BASE_PATH = "/aipocalypse";
    expect(absoluteAppUrl("https://labs.mestr.io/aipocalypse/auth/login", "/auth/callback")).toBe(
      "https://labs.mestr.io/aipocalypse/auth/callback"
    );
  });
});
