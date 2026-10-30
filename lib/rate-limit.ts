export const RATE_LIMIT_WINDOW_MS = 60_000;

export const SUGGESTIONS_PER_MINUTE = 90;

export const EVENTS_PER_MINUTE = 180;

const MAX_TRACKED_KEYS = 10_000;

type Window = { startedAt: number; count: number };

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function createRateLimiter(
  limit: number,
  windowMs = RATE_LIMIT_WINDOW_MS,
): (key: string, now: number) => RateLimitResult {
  const windows = new Map<string, Window>();

  return (key, now) => {
    const current = windows.get(key);
    if (current !== undefined && now - current.startedAt < windowMs) {
      if (current.count >= limit) {
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.startedAt + windowMs - now) / 1000)) };
      }
      current.count += 1;
      return { allowed: true };
    }

    windows.delete(key);
    windows.set(key, { startedAt: now, count: 1 });
    for (const [storedKey, stored] of windows) {
      if (windows.size <= MAX_TRACKED_KEYS && now - stored.startedAt < windowMs) break;
      windows.delete(storedKey);
    }
    return { allowed: true };
  };
}

export function rateLimitedResponse(retryAfterSeconds: number): Response {
  return new Response(null, { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } });
}
