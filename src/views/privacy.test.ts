import { test, expect, describe } from "bun:test";
import { privacyPage } from "./privacy";

describe("privacyPage", () => {
  const html = privacyPage(null);

  test("contains key privacy phrases", () => {
    expect(html).toContain("hash");
    expect(html).toContain("GitHub");
    expect(html).toContain("one-way");
  });

  test("does NOT contain CREATE TABLE or SQL DDL", () => {
    expect(html).not.toContain("CREATE TABLE");
    expect(html).not.toContain("PRIMARY KEY");
    expect(html).not.toContain("NOT NULL");
  });

  test("mentions that username/avatar/token are not stored", () => {
    expect(html).toContain("username");
    expect(html).toContain("avatar");
    expect(html).toContain("token");
  });

  test("mentions session cookie", () => {
    expect(html).toContain("aipocalypse_session");
  });

  test("contains link to account page for GDPR rights", () => {
    expect(html).toContain('href="/account"');
  });

  test("contains link to source code repository", () => {
    expect(html).toContain("github.com/mestr-io/aipocalypse");
  });

  test("shows example hashed ID in green", () => {
    expect(html).toContain('class="green"');
  });

  test("renders with layout for logged-out user", () => {
    expect(html).toContain("<html");
    expect(html).toContain("Privacy");
    expect(html).toContain("Sign in with GitHub");
  });

  test("renders with layout for logged-in user", () => {
    const user = {
      id: "test-id",
      hashedId: "a7f3b2c1e9d04f8baa",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };
    const loggedInHtml = privacyPage(user);
    expect(loggedInHtml).toContain("a7f3b2");
    expect(loggedInHtml).toContain("Privacy");
  });
});
