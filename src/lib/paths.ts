function normalizeBasePath(input: string | undefined): string {
  const trimmed = input?.trim() ?? "";
  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

export function getBasePath(): string {
  return normalizeBasePath(process.env.APP_BASE_PATH);
}

export function appPath(path: string): string {
  const normalizedBase = getBasePath();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!normalizedBase) {
    return normalizedPath;
  }
  return normalizedPath === "/" ? normalizedBase : `${normalizedBase}${normalizedPath}`;
}

export function absoluteAppUrl(requestUrl: string, path: string): string {
  const url = new URL(requestUrl);
  return `${url.protocol}//${url.host}${appPath(path)}`;
}

export function normalizeAppBasePathForTest(input: string | undefined): string {
  return normalizeBasePath(input);
}
