import { test, expect, describe } from "bun:test";
import { renderIdentity } from "./identity";

describe("renderIdentity", () => {
  const testHash = "a7f3b2c1e9d04f8baa";

  test("wraps output in an anchor linking to /account", () => {
    const html = renderIdentity(testHash);
    expect(html).toStartWith('<a href="/account"');
    expect(html).toEndWith("</a>");
  });

  test("anchor has identity class", () => {
    const html = renderIdentity(testHash);
    expect(html).toContain('class="identity"');
  });

  test("text segments use green link color (#009900)", () => {
    const html = renderIdentity(testHash);
    // All three text segments should use green
    expect(html).toContain('<span style="color:#009900">a7f3b2</span>');
    expect(html).toContain('<span style="color:#009900">c1e9d0</span>');
    expect(html).toContain('<span style="color:#009900">4f8baa</span>');
  });

  test("text segments do NOT use segment hex as color", () => {
    const html = renderIdentity(testHash);
    // Should not have per-segment colors on text
    expect(html).not.toContain('color:#a7f3b2">a7f3b2');
    expect(html).not.toContain('color:#c1e9d0">c1e9d0');
    expect(html).not.toContain('color:#4f8baa">4f8baa');
  });

  test("glyph squares use per-segment hex colors", () => {
    const html = renderIdentity(testHash);
    expect(html).toContain('<span style="color:#a7f3b2">\u25A0</span>');
    expect(html).toContain('<span style="color:#c1e9d0">\u25A0</span>');
    expect(html).toContain('<span style="color:#4f8baa">\u25A0</span>');
  });

  test("segments are separated by hyphens", () => {
    const html = renderIdentity(testHash);
    // The pattern: seg1</span>-<span...>seg2</span>-<span...>seg3
    expect(html).toContain("a7f3b2</span>-<span");
    expect(html).toContain("c1e9d0</span>-<span");
  });

  test("has a space between text and glyphs", () => {
    const html = renderIdentity(testHash);
    // Last text segment followed by space then first glyph
    expect(html).toContain("4f8baa</span> <span");
  });
});
