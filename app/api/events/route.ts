import { cookies } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { clientIpFrom } from "@/features/account/server/session";
import { createDeduper, handleEvent } from "@/features/events/lib/handle";
import { sendEvent } from "@/lib/marketplace/client";
import { createRateLimiter, EVENTS_PER_MINUTE, rateLimitedResponse } from "@/lib/rate-limit";

const SESSION_COOKIE = "sid";

const shouldForward = createDeduper();

const checkRate = createRateLimiter(EVENTS_PER_MINUTE);

async function readSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const current = cookieStore.get(SESSION_COOKIE)?.value;
  if (current !== undefined && z.uuid().safeParse(current).success) return current;

  const sessionId = crypto.randomUUID();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return sessionId;
}

export async function POST(request: Request): Promise<Response> {
  const clientIp = clientIpFrom(request.headers.get("x-forwarded-for"));
  if (clientIp !== null) {
    const rate = checkRate(clientIp, Date.now());
    if (!rate.allowed) return rateLimitedResponse(rate.retryAfterSeconds);
  }

  const sessionId = await readSessionId();
  const { status, forward } = handleEvent({
    body: await request.text(),
    userAgent: request.headers.get("user-agent"),
    sessionId,
    now: Date.now(),
    shouldForward,
  });

  if (forward !== null) {
    after(() =>
      sendEvent(forward, clientIp).catch((error: unknown) => {
        console.error("[events]", error);
      }),
    );
  }

  return new Response(null, { status });
}
