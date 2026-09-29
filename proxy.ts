import { NextResponse, type NextRequest } from "next/server";
import { loginHref } from "@/features/account/returnPath";

const SESSION_COOKIE = "mp_session";

export function proxy(request: NextRequest): NextResponse {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL(loginHref(request.nextUrl.pathname), request.url));
}

export const config = {
  matcher: ["/cuenta", "/cuenta/:path*"],
};
