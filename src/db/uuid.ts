/**
 * UUID v7 generator.
 *
 * UUID v7 encodes a millisecond-precision timestamp in the first 48 bits,
 * giving natural chronological ordering when sorted lexicographically.
 *
 * Format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
 *   - Bits 0-47:  Unix timestamp in milliseconds
 *   - Bits 48-51: Version (0b0111 = 7)
 *   - Bits 52-63: Random
 *   - Bits 64-65: Variant (0b10)
 *   - Bits 66-127: Random
 */
export function generateUUIDv7(): string {
  const now = Date.now();

  // Get 6 bytes of random data for the lower portion
  const random = crypto.getRandomValues(new Uint8Array(10));

  // Encode timestamp into first 6 bytes (48 bits)
  const timestampHigh = Math.floor(now / 0x10000);
  const timestampLow = now & 0xffff;

  // Build the UUID components
  // Bytes 0-3: timestamp high 32 bits
  const timeLow = timestampHigh.toString(16).padStart(8, "0");
  // Bytes 4-5: timestamp low 16 bits
  const timeMid = timestampLow.toString(16).padStart(4, "0");
  // Bytes 6-7: version (7) + 12 bits random
  const rand12 = ((random[0]! & 0x0f) << 8) | random[1]!;
  const timeHiAndVersion = "7" + rand12.toString(16).padStart(3, "0");
  // Bytes 8-9: variant (10) + 14 bits random
  const clockSeq =
    ((0x80 | (random[2]! & 0x3f)) << 8 | random[3]!).toString(16).padStart(4, "0");
  // Bytes 10-15: 48 bits random
  const node = Array.from(random.slice(4))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`;
}
