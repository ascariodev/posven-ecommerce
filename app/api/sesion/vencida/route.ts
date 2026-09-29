import { NextResponse } from "next/server";
import { loginHref, safeReturnPath } from "@/features/account/returnPath";
import { SESSION_COOKIE, sessionCookieOptions } from "@/features/account/session";

export function GET(request: Request): NextResponse {
  const volver = safeReturnPath(new URL(request.url).searchParams.get("volver"));
  const response = NextResponse.redirect(new URL(`${loginHref(volver)}&aviso=sesion`, request.url), 303);
  response.cookies.delete({ name: SESSION_COOKIE, path: sessionCookieOptions().path });
  return response;
}
