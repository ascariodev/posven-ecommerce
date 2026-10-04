import { eventInputSchema, type MarketplaceEvent } from "@/lib/marketplace/schemas";

export const EVENT_DEDUP_WINDOW_MS = 600_000;

const MAX_DEDUP_KEYS = 10_000;

const MAX_EVENT_BODY_CHARS = 1024;

const BOT_USER_AGENT = /bot|crawl|spider|slurp|facebookexternalhit|headless|lighthouse|preview/i;

export function isBot(userAgent: string | null): boolean {
  return userAgent === null || BOT_USER_AGENT.test(userAgent);
}

export function createDeduper(windowMs = EVENT_DEDUP_WINDOW_MS): (key: string, now: number) => boolean {
  const lastForwardedAt = new Map<string, number>();

  return (key, now) => {
    const last = lastForwardedAt.get(key);
    if (last !== undefined && now - last < windowMs) return false;

    lastForwardedAt.delete(key);
    lastForwardedAt.set(key, now);
    for (const [storedKey, forwardedAt] of lastForwardedAt) {
      if (lastForwardedAt.size <= MAX_DEDUP_KEYS && now - forwardedAt < windowMs) break;
      lastForwardedAt.delete(storedKey);
    }
    return true;
  };
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

export function handleEvent(p: {
  body: string;
  userAgent: string | null;
  sessionId: string;
  now: number;
  shouldForward: (key: string, now: number) => boolean;
}): { status: 202 | 400; forward: MarketplaceEvent | null } {
  if (p.body.length > MAX_EVENT_BODY_CHARS) return { status: 400, forward: null };
  const parsed = eventInputSchema.safeParse(parseJson(p.body));
  if (!parsed.success) return { status: 400, forward: null };
  if (isBot(p.userAgent)) return { status: 202, forward: null };

  const event = parsed.data;
  const key = `${p.sessionId}|${event.type}|${event.store_slug ?? ""}|${event.product_slug ?? ""}|${event.query ?? ""}|${event.category_slug ?? ""}`;
  if (!p.shouldForward(key, p.now)) return { status: 202, forward: null };

  return { status: 202, forward: { ...event, session_id: p.sessionId } };
}
