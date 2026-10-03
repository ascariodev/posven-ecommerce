"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { AccountContext } from "@/lib/marketplace/params";
import { cartEnabled } from "@/features/cart/lib/flag";
import { mergeGuestCart } from "@/features/cart/server/cart";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../lib/formSchemas";
import { formStateFromError, formStateFromZod, type FormState } from "../lib/formState";
import { safeReturnPath } from "../lib/returnPath";
import { accountContext, endSession, SESSION_COOKIE, sessionCookieOptions, withSession } from "./session";

const FORGOT_PASSWORD_SUCCESS =
  "Si el correo está registrado, te enviamos un enlace para crear una contraseña nueva. Vence en 60 minutos.";
const VERIFY_EMAIL_SUCCESS = "Tu correo quedó verificado.";
const RESEND_VERIFICATION_SUCCESS = "Te enviamos un enlace nuevo. Revisa tu correo.";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function pick(formData: FormData, names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, field(formData, name)]));
}

function success(message: string): FormState {
  return { status: "success", message, fields: {}, values: {} };
}

// Guarda la sesión y fusiona el carrito de invitado con el del comprador (RN-CART-02).
async function startSession(ctx: AccountContext, token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
  if (cartEnabled()) await mergeGuestCart({ ...ctx, session: token });
}

export async function login(prev: FormState, formData: FormData): Promise<FormState> {
  const values = pick(formData, ["email", "volver"]);
  const input = { email: values.email, password: field(formData, "password") };
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return formStateFromZod(parsed.error, values);
  const ctx = await accountContext();
  let token: string;
  try {
    ({ token } = await loginCustomer(ctx, input));
  } catch (error) {
    return formStateFromError(error, values);
  }
  await startSession(ctx, token);
  redirect(safeReturnPath(values.volver));
}

export async function register(prev: FormState, formData: FormData): Promise<FormState> {
  const values = pick(formData, [
    "name",
    "email",
    "phone",
    "billing.document_type",
    "billing.document",
    "billing.address",
    "billing.taxpayer_type",
    "volver",
  ]);
  const password = field(formData, "password");
  const parsed = registerSchema.safeParse({ ...values, password });
  if (!parsed.success) return formStateFromZod(parsed.error, values);
  const ctx = await accountContext();
  let token: string;
  try {
    ({ token } = await registerCustomer(ctx, { name: values.name, email: values.email, phone: values.phone, password }));
  } catch (error) {
    return formStateFromError(error, values);
  }
  await startSession(ctx, token);
  redirect(safeReturnPath(values.volver));
}

export async function logout(): Promise<void> {
  const ctx = await accountContext();
  if (ctx.session !== null) {
    try {
      await logoutCustomer(ctx);
    } catch (error) {
      if (!(error instanceof MarketplaceUnavailableError || error instanceof MarketplaceAccountError)) throw error;
    }
  }
  await endSession("/");
}

export async function forgotPassword(prev: FormState, formData: FormData): Promise<FormState> {
  const values = pick(formData, ["email"]);
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return formStateFromZod(parsed.error, values);
  const ctx = await accountContext();
  try {
    await requestPasswordReset(ctx, values.email);
  } catch (error) {
    return formStateFromError(error, values);
  }
  return success(FORGOT_PASSWORD_SUCCESS);
}

export async function resetPasswordAction(prev: FormState, formData: FormData): Promise<FormState> {
  const values = pick(formData, ["token"]);
  const input = { token: values.token, password: field(formData, "password") };
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return formStateFromZod(parsed.error, values);
  const ctx = await accountContext();
  try {
    await resetPassword(ctx, input);
  } catch (error) {
    const state = formStateFromError(error, values);
    const tokenRejected =
      error instanceof MarketplaceAccountError && (error.code === "token_invalid" || error.code === "token_expired");
    return tokenRejected ? { ...state, fields: { ...state.fields, token: error.message } } : state;
  }
  return endSession("/entrar?aviso=contrasena");
}

export async function verifyEmailAction(prev: FormState, formData: FormData): Promise<FormState> {
  const values = pick(formData, ["token"]);
  const ctx = await accountContext();
  try {
    await verifyEmail(ctx, values.token);
  } catch (error) {
    return formStateFromError(error, values);
  }
  return success(VERIFY_EMAIL_SUCCESS);
}

export async function resendVerificationAction(prev: FormState, formData: FormData): Promise<FormState> {
  void prev;
  void formData;
  return withSession("/cuenta", async (ctx) => {
    try {
      await resendVerification(ctx);
    } catch (error) {
      return formStateFromError(error, {});
    }
    return success(RESEND_VERIFICATION_SUCCESS);
  });
}
