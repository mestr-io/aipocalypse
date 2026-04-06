import { test, expect, describe } from "bun:test";
import { accountPage } from "./account";

const testUser = {
  id: "test-user-id",
  hashedId: "a7f3b2c1e9d04f8baa",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

describe("accountPage", () => {
  const html = accountPage(testUser, "csrf-token-123");

  test("renders identity with green text segments", () => {
    expect(html).toContain('color:#009900">a7f3b2</span>');
    expect(html).toContain('color:#009900">c1e9d0</span>');
    expect(html).toContain('color:#009900">4f8baa</span>');
  });

  test("renders identity glyph squares with segment colors", () => {
    expect(html).toContain('color:#a7f3b2">\u25A0</span>');
    expect(html).toContain('color:#c1e9d0">\u25A0</span>');
    expect(html).toContain('color:#4f8baa">\u25A0</span>');
  });

  test("contains export data link", () => {
    expect(html).toContain('href="/account/export"');
    expect(html).toContain("Download my data");
  });

  test("contains delete account form with correct action", () => {
    expect(html).toContain('action="/account/delete"');
    expect(html).toContain("Delete my account");
  });

  test("includes csrf token in delete form", () => {
    expect(html).toContain('name="csrfToken"');
    expect(html).toContain('value="csrf-token-123"');
  });

  test("does not use browser confirm dialog", () => {
    expect(html).not.toContain("onsubmit");
    expect(html).not.toContain("confirm(");
  });

  test("contains slide-reveal elements", () => {
    expect(html).toContain('class="delete-slide"');
    expect(html).toContain('id="delete-toggle"');
    expect(html).toContain('class="delete-slide-track"');
    expect(html).toContain('class="delete-slide-initial"');
    expect(html).toContain('class="delete-slide-confirm"');
  });

  test("slide-reveal has keep and confirm buttons", () => {
    expect(html).toContain("No... keep my account");
    expect(html).toContain("Yes, delete my account");
  });

  test("confirm button is a submit button", () => {
    expect(html).toContain('type="submit"');
    expect(html).toContain("Yes, delete my account");
  });

  test("contains logout link", () => {
    expect(html).toContain('href="/auth/logout"');
    expect(html).toContain("Logout");
  });

  test("logout link has section-heading separator", () => {
    expect(html).toContain('class="section-heading"');
    expect(html).toContain('class="section-heading"><a href="/auth/logout">Logout</a>');
  });

  test("delete account heading has section-heading for spacing", () => {
    expect(html).toContain('class="section-heading danger"');
  });

  test("renders within layout", () => {
    expect(html).toContain("<html");
    expect(html).toContain("Account");
  });
});
