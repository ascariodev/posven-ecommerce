import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loginCustomer,
  logoutCustomer,
  requestPasswordReset,
  resendVerification,
} from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { Customer } from "@/lib/marketplace/schemas";
import { forgotPassword, login, logout, resendVerificationAction } from "./actions";
import { INITIAL_FORM_STATE } from "./formState";

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`);
  }),
}));

vi.mock("@/lib/marketplace/client", () => ({
  loginCustomer: vi.fn(),
  registerCustomer: vi.fn(),
  logoutCustomer: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
  getMe: vi.fn(),
}));

const customer: Customer = {
  name: "Comprador",
  email: "comprador@posven.test",
  phone: "04141234567",
  email_verified: false,
  pending_email: null,
  settings: { order_status_emails: true },
};

const unavailableMessage = "No pudimos conectar con el servicio. Intenta de nuevo en unos segundos.";

function withSessionCookie(value: string | null): void {
  cookieStore.get.mockImplementation((name: string) =>
    name === "mp_session" && value !== null ? { name, value } : undefined,
  );
}

function loginForm(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) formData.set(name, value);
  return formData;
}

afterEach(() => {
  cookieStore.get.mockReset();
  cookieStore.set.mockReset();
  cookieStore.delete.mockReset();
  vi.mocked(loginCustomer).mockReset();
  vi.mocked(logoutCustomer).mockReset();
  vi.mocked(requestPasswordReset).mockReset();
  vi.mocked(resendVerification).mockReset();
});

describe("login", () => {
  it("fija mp_session con las opciones exactas y redirige a volver (RN-ACCOUNT-01)", async () => {
    withSessionCookie(null);
    vi.mocked(loginCustomer).mockResolvedValue({ token: "7|nuevo", customer });

    await expect(
      login(INITIAL_FORM_STATE, loginForm({ email: customer.email, password: "secreta123", volver: "/p/x?y=1" })),
    ).rejects.toThrow("NEXT_REDIRECT:/p/x?y=1");
    expect(cookieStore.set).toHaveBeenCalledWith("mp_session", "7|nuevo", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 2592000,
    });
  });

  it("con volver externo redirige a /cuenta (RN-ACCOUNT-02)", async () => {
    withSessionCookie(null);
    vi.mocked(loginCustomer).mockResolvedValue({ token: "7|nuevo", customer });

    await expect(
      login(INITIAL_FORM_STATE, loginForm({ email: customer.email, password: "secreta123", volver: "//evil.test" })),
    ).rejects.toThrow("NEXT_REDIRECT:/cuenta");
  });

  it("con invalid_credentials devuelve el mensaje de la API, conserva el correo y no la contraseña", async () => {
    withSessionCookie(null);
    vi.mocked(loginCustomer).mockRejectedValue(
      new MarketplaceAccountError({
        status: 422,
        code: "invalid_credentials",
        message: "Correo o contraseña incorrectos.",
      }),
    );

    const state = await login(
      INITIAL_FORM_STATE,
      loginForm({ email: customer.email, password: "equivocada", volver: "/cuenta" }),
    );

    expect(state).toEqual({
      status: "error",
      message: "Correo o contraseña incorrectos.",
      fields: {},
      values: { email: customer.email, volver: "/cuenta" },
    });
    expect(state.values).not.toHaveProperty("password");
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("con 429 muestra los segundos de retryAfter", async () => {
    withSessionCookie(null);
    vi.mocked(loginCustomer).mockRejectedValue(
      new MarketplaceAccountError({
        status: 429,
        code: "too_many_attempts",
        message: "Demasiados intentos. Prueba de nuevo en 42 segundos.",
        retryAfter: 42,
      }),
    );

    const state = await login(INITIAL_FORM_STATE, loginForm({ email: customer.email, password: "x", volver: "/cuenta" }));

    expect(state.message).toBe("Demasiados intentos, prueba en 42 segundos");
  });

  it("con la API caída devuelve el aviso sin tocar la cookie", async () => {
    withSessionCookie(null);
    vi.mocked(loginCustomer).mockRejectedValue(new MarketplaceUnavailableError("/auth/login"));

    const state = await login(INITIAL_FORM_STATE, loginForm({ email: customer.email, password: "x", volver: "/cuenta" }));

    expect(state.status).toBe("error");
    expect(state.message).toBe(unavailableMessage);
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("borra la cookie aunque logoutCustomer lance", async () => {
    withSessionCookie("12|abc");
    vi.mocked(logoutCustomer).mockRejectedValue(new MarketplaceUnavailableError("/auth/logout"));

    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: "mp_session", path: "/" });
  });
});

describe("resendVerificationAction (RN-ACCOUNT-03)", () => {
  it("con unauthenticated borra la cookie y lleva a entrar", async () => {
    withSessionCookie("12|abc");
    vi.mocked(resendVerification).mockRejectedValue(
      new MarketplaceAccountError({ status: 401, code: "unauthenticated", message: "Inicia sesión para continuar." }),
    );

    await expect(resendVerificationAction(INITIAL_FORM_STATE, new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/entrar?volver=%2Fcuenta",
    );
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: "mp_session", path: "/" });
  });

  it("con un 401 que llega como API caída conserva la cookie", async () => {
    withSessionCookie("12|abc");
    vi.mocked(resendVerification).mockRejectedValue(new MarketplaceUnavailableError("/auth/email/resend"));

    const state = await resendVerificationAction(INITIAL_FORM_STATE, new FormData());

    expect(state.message).toBe(unavailableMessage);
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });
});

describe("forgotPassword", () => {
  it("devuelve el mismo éxito para cualquier correo", async () => {
    withSessionCookie(null);
    vi.mocked(requestPasswordReset).mockResolvedValue(undefined);

    const known = await forgotPassword(INITIAL_FORM_STATE, loginForm({ email: customer.email }));
    const unknown = await forgotPassword(INITIAL_FORM_STATE, loginForm({ email: "nadie@posven.test" }));

    expect(known).toEqual(unknown);
    expect(known).toEqual({
      status: "success",
      message:
        "Si el correo está registrado, te enviamos un enlace para crear una contraseña nueva. Vence en 60 minutos.",
      fields: {},
      values: {},
    });
  });
});
