import { cookies } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { createDeduper, handleEvent } from "@/features/events/handle";
import { sendEvent } from "@/lib/marketplace/client";

const SESSION_COOKIE = "sid";

const shouldForward = createDeduper();

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
      sendEvent(forward).catch((error: unknown) => {
        console.error("[events]", error);
      }),
    );
  }

  return new Response(null, { status });
}
