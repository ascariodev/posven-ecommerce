const MAX_RETURN_PATH_LENGTH = 512;

function hasForbiddenChar(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code === 0x7f || value[index] === "\\") return true;
  }
  return false;
}

export function safeReturnPath(raw: unknown, fallback = "/cuenta"): string {
  if (typeof raw !== "string") return fallback;
  if (raw.length > MAX_RETURN_PATH_LENGTH) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (hasForbiddenChar(raw)) return fallback;
  return raw;
}

export function loginHref(path: string): string {
  return `/entrar?volver=${encodeURIComponent(path)}`;
}
