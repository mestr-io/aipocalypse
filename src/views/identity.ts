/**
 * Three-color identity rendering.
 *
 * Takes an 18-char hex hash and renders it as three colored segments
 * separated by hyphens, followed by three colored square glyphs.
 * Each 6-char segment is used as both the text content and its CSS color.
 */

/**
 * Render a three-color identity badge from an 18-char hex hash.
 *
 * Output format:
 *   <a href="/account">
 *     <span style="color:#seg1">seg1</span>-
 *     <span style="color:#seg2">seg2</span>-
 *     <span style="color:#seg3">seg3</span>
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
    .map((s) => `<span style="color:#${s}">${s}</span>`)
    .join("-");

  const glyphs = segments
    .map((s) => `<span style="color:#${s}">\u25A0</span>`)
    .join("");

  return `<a href="/account" class="identity">${hashText} ${glyphs}</a>`;
}
