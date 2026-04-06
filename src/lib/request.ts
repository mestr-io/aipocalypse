function resolveOrigin(requestUrl: string = "http://localhost/", forwardedProto?: string, host?: string): URL {
  const url = new URL(requestUrl);
  const effectiveHost = host?.split(",")[0]?.trim() || url.host;
  const effectiveProto = forwardedProto?.split(",")[0]?.trim() || url.protocol.replace(":", "");
  return new URL(`${effectiveProto}://${effectiveHost}`);
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

export function shouldUseSecureCookies(requestUrl: string = "http://localhost/", forwardedProto?: string, host?: string): boolean {
  const origin = resolveOrigin(requestUrl, forwardedProto, host);
  return !isLocalHostname(origin.hostname);
}

export function getClientKey(forwardedFor?: string, realIp?: string): string {
  const forwarded = forwardedFor?.split(",")[0]?.trim();
  const direct = realIp?.trim();
  return forwarded || direct || "unknown";
}
