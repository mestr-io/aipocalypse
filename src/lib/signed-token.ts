const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    return null;
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  const padding = (4 - (value.length % 4)) % 4;
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padding);
  return new Uint8Array(Buffer.from(base64, "base64"));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signMessageHex(secret: string, message: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(new Uint8Array(signature));
}

export async function verifyMessageHex(secret: string, message: string, signatureHex: string): Promise<boolean> {
  const signature = fromHex(signatureHex);
  if (!signature) {
    return false;
  }

  const key = await importHmacKey(secret);
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(message));
}

export async function signJsonToken<T>(secret: string, payload: T): Promise<string> {
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await signMessageHex(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyJsonToken<T>(secret: string, token: string): Promise<T | null> {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) {
    return null;
  }

  const encodedPayload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  if (!(await verifyMessageHex(secret, encodedPayload, signature))) {
    return null;
  }

  const bytes = fromBase64Url(encodedPayload);
  if (!bytes) {
    return null;
  }

  try {
    return JSON.parse(decoder.decode(bytes)) as T;
  } catch {
    return null;
  }
}
