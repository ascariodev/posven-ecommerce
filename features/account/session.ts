import "server-only";
import { isIP } from "node:net";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getMe } from "@/lib/marketplace/client";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import type { AccountContext } from "@/lib/marketplace/params";
import type { Customer } from "@/lib/marketplace/schemas";
import { loginHref } from "./returnPath";

export const SESSION_COOKIE = "mp_session";

const SESSION_TOKEN_PATTERN = /^\d{1,18}\|.+$/;
const MAX_SESSION_LENGTH = 512;

export function sessionCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 2592000,
  };
}

export async function readSession(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (value === undefined || value.length > MAX_SESSION_LENGTH) return null;
  return SESSION_TOKEN_PATTERN.test(value) ? value : null;
}

export function clientIpFrom(forwardedFor: string | null): string | null {
  if (forwardedFor === null) return null;
  const last = forwardedFor.split(",").at(-1)?.trim() ?? "";
  return isIP(last) !== 0 ? last : null;
}

export async function clientIp(): Promise<string | null> {
  return clientIpFrom((await headers()).get("x-forwarded-for"));
}

export async function accountContext(): Promise<AccountContext> {
  return { session: await readSession(), clientIp: await clientIp() };
}

function isUnauthenticated(error: unknown): boolean {
  return error instanceof MarketplaceAccountError && error.code === "unauthenticated";
}

export const getCurrentCustomer = cache(async (): Promise<Customer | null> => {
  const ctx = await accountContext();
  if (ctx.session === null) return null;
  try {
    return await getMe(ctx);
  } catch (error) {
    if (isUnauthenticated(error)) return null;
    throw error;
  }
});

export async function requireCustomer(path: string): Promise<{ customer: Customer; ctx: AccountContext }> {
  const ctx = await accountContext();
  if (ctx.session === null) redirect(loginHref(path));
  const customer = await getCurrentCustomer();
  if (customer === null) redirect(`/api/sesion/vencida?volver=${encodeURIComponent(path)}`);
  return { customer, ctx };
}

export async function endSession(to: string): Promise<never> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: sessionCookieOptions().path });
  redirect(to);
}

export async function withSession<T>(returnTo: string, run: (ctx: AccountContext) => Promise<T>): Promise<T> {
  const ctx = await accountContext();
  if (ctx.session === null) redirect(loginHref(returnTo));
  try {
    return await run(ctx);
  } catch (error) {
    if (!isUnauthenticated(error)) throw error;
  }
  return endSession(loginHref(returnTo));
}
