/**
 * Hash derivation for user identity.
 *
 * Computes a deterministic 18-character hex hash from a GitHub numeric ID
 * using HMAC-SHA256 with a server-side pepper. The result is split into
 * three 6-char segments, each usable as an HTML hex color.
 *
 * The pepper (HASH_PEPPER env var) must be kept secret — if it leaks
 * alongside a database dump, hashes are trivially reversible by
 * enumerating ~200M GitHub IDs.
 */

/**
 * Get the HASH_PEPPER from environment. Throws if not set.
 */
export function getHashPepper(): string {
  const pepper = process.env.HASH_PEPPER;
  if (!pepper) {
    throw new Error(
      "HASH_PEPPER environment variable is not set. " +
        "Generate one with: openssl rand -hex 32"
    );
  }
  return pepper;
}

/**
 * Compute a hashed identity from a GitHub numeric ID.
 *
 * Uses HMAC-SHA256(pepper, githubId.toString()) and truncates the
 * hex digest to 18 characters (72 bits). The result is three 6-char
 * hex groups, each a valid CSS color.
 *
 * @returns 18 lowercase hex characters (e.g. "a7f3b2c1e9d04f8baa")
 */
export function computeHashedId(githubId: number): string {
  const pepper = getHashPepper();
  const hmac = new Bun.CryptoHasher("sha256", pepper);
  hmac.update(githubId.toString());
  const hex = hmac.digest("hex");
  return hex.slice(0, 18);
}
