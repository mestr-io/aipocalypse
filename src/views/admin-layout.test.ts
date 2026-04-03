import { test, expect, describe } from "bun:test";
import { adminLayout } from "./admin-layout";

describe("adminLayout", () => {
  test("renders nav with 'AIPocalypse Admin' linking to /admin", () => {
    const html = adminLayout("<p>hello</p>");
    expect(html).toContain('class="site-title"');
    expect(html).toContain(">AIPocalypse Admin</a>");
    expect(html).toContain('href="/admin"');
  });

  test("unauthenticated renders no logout link", () => {
    const html = adminLayout("<p>hello</p>");
    expect(html).not.toContain("logout from admin site");
    expect(html).not.toContain("/admin/logout");
  });

  test("authenticated renders logout link in nav", () => {
    const html = adminLayout("<p>hello</p>", { authenticated: true });
    expect(html).toContain("logout from admin site");
    expect(html).toContain('href="/admin/logout"');
  });

  test("no footer present", () => {
    const html = adminLayout("<p>hello</p>", { authenticated: true });
    expect(html).not.toContain("<footer");
    expect(html).not.toContain("</footer>");
  });

  test("no 'Sign in with GitHub' present", () => {
    const html = adminLayout("<p>hello</p>");
    expect(html).not.toContain("Sign in with GitHub");
  });

  test("no privacy link present", () => {
    const html = adminLayout("<p>hello</p>");
    expect(html).not.toContain("/privacy");
    expect(html).not.toContain("we store minimal data");
  });

  test("renders content in main container", () => {
    const html = adminLayout("<p>test content</p>");
    expect(html).toContain("<p>test content</p>");
    expect(html).toContain("<main>");
  });

  test("uses custom title in page title", () => {
    const html = adminLayout("<p>hello</p>", { title: "Edit Poll" });
    expect(html).toContain("<title>Edit Poll — AIPocalypse</title>");
  });

  test("defaults title to Admin", () => {
    const html = adminLayout("<p>hello</p>");
    expect(html).toContain("<title>Admin — AIPocalypse</title>");
  });

  test("includes shared stylesheet", () => {
    const html = adminLayout("<p>hello</p>");
    expect(html).toContain('href="/public/style.css"');
  });
});
