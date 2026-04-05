import { appPath } from "../lib/paths";

/**
 * Identity rendering with green text and colored glyphs.
 *
 * Takes an 18-char hex hash and renders it as three segments in the
 * standard green link color, separated by hyphens, followed by three
 * colored square glyphs where each glyph uses the segment's hex value.
 */

/**
 * Render an identity badge from an 18-char hex hash.
 *
 * Output format:
 *   <a href="/account" class="identity">
 *     <span style="color:#009900">seg1</span>-
 *     <span style="color:#009900">seg2</span>-
 *     <span style="color:#009900">seg3</span>
 *     <span style="color:#seg1">■</span>
 *     <span style="color:#seg2">■</span>
 *     <span style="color:#seg3">■</span>
 *   </a>
 */
export function renderIdentity(hashedId: string): string {
  const seg1 = hashedId.slice(0, 6);
  const seg2 = hashedId.slice(6, 12);
  const seg3 = hashedId.slice(12, 18);

  const segments = [seg1, seg2, seg3];

  const hashText = segments
    .map((s) => `<span style="color:#009900">${s}</span>`)
    .join("-");

  const glyphs = segments
    .map((s) => `<span style="color:#${s}">\u25A0</span>`)
    .join("");

  return `<a href="${appPath("/account")}" class="identity">${hashText} ${glyphs}</a>`;
}
