import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loginCustomer,
  logoutCustomer,
  mergeCart,
  registerCustomer,
  requestPasswordReset,
  resendVerification,
} from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { Customer } from "@/lib/marketplace/schemas";
import { forgotPassword, login, logout, register, resendVerificationAction } from "./actions";
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
  getCart: vi.fn(),
  mergeCart: vi.fn(),
  quoteGuestCart: vi.fn(),
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
  vi.mocked(registerCustomer).mockReset();
  vi.mocked(mergeCart).mockReset();
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

describe("fusión del carrito de invitado al entrar (RN-CART-02)", () => {
  const guestCart = JSON.stringify([
    { store_slug: "farmacia-central-valencia", product_slug: "acetaminofen-500-mg-20-tabletas", quantity: 2 },
  ]);
  const form = { email: customer.email, password: "secreta123", volver: "/carrito" };

  beforeEach(() => {
    vi.stubEnv("MARKETPLACE_MODE", "mock");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function withGuestCart(value: string): void {
    cookieStore.get.mockImplementation((name: string) => (name === "mp_cart" ? { name, value } : undefined));
  }

  function cartDeleted(): boolean {
    return cookieStore.delete.mock.calls.some(([arg]) => (arg as { name: string }).name === "mp_cart");
  }

  it("login fusiona con el token nuevo y borra mp_cart", async () => {
    withGuestCart(guestCart);
    vi.mocked(loginCustomer).mockResolvedValue({ token: "7|nuevo", customer });

    await expect(login(INITIAL_FORM_STATE, loginForm(form))).rejects.toThrow("NEXT_REDIRECT:/carrito");

    expect(mergeCart).toHaveBeenCalledWith(
      { session: "7|nuevo", clientIp: null },
      [{ store_slug: "farmacia-central-valencia", product_slug: "acetaminofen-500-mg-20-tabletas", quantity: 2 }],
    );
    expect(cartDeleted()).toBe(true);
  });

  it("register también fusiona", async () => {
    withGuestCart(guestCart);
    vi.mocked(registerCustomer).mockResolvedValue({ token: "8|nuevo", customer });

    await expect(
      register(INITIAL_FORM_STATE, loginForm({ ...form, name: "Comprador", phone: "04141234567" })),
    ).rejects.toThrow("NEXT_REDIRECT:/carrito");

    expect(mergeCart).toHaveBeenCalledOnce();
    expect(cartDeleted()).toBe(true);
  });

  it("con la API caída el login sigue y mp_cart se conserva para el próximo", async () => {
    withGuestCart(guestCart);
    vi.mocked(loginCustomer).mockResolvedValue({ token: "7|nuevo", customer });
    vi.mocked(mergeCart).mockRejectedValue(new MarketplaceUnavailableError("/me/cart/merge"));

    await expect(login(INITIAL_FORM_STATE, loginForm(form))).rejects.toThrow("NEXT_REDIRECT:/carrito");

    expect(cartDeleted()).toBe(false);
  });

  it("con un error de la API el login sigue y mp_cart se borra (no se reintenta siempre)", async () => {
    withGuestCart(guestCart);
    vi.mocked(loginCustomer).mockResolvedValue({ token: "7|nuevo", customer });
    vi.mocked(mergeCart).mockRejectedValue(
      new MarketplaceAccountError({ status: 422, code: "validation_failed", message: "Revisa los datos del formulario." }),
    );

    await expect(login(INITIAL_FORM_STATE, loginForm(form))).rejects.toThrow("NEXT_REDIRECT:/carrito");

    expect(cartDeleted()).toBe(true);
  });

  it("con un 429 el login sigue y mp_cart se conserva (es pasajero)", async () => {
    withGuestCart(guestCart);
    vi.mocked(loginCustomer).mockResolvedValue({ token: "7|nuevo", customer });
    vi.mocked(mergeCart).mockRejectedValue(
      new MarketplaceAccountError({ status: 429, code: "too_many_attempts", message: "Demasiados intentos.", retryAfter: 30 }),
    );

    await expect(login(INITIAL_FORM_STATE, loginForm(form))).rejects.toThrow("NEXT_REDIRECT:/carrito");

    expect(cartDeleted()).toBe(false);
  });

  it("con el carrito apagado no fusiona ni toca mp_cart", async () => {
    vi.stubEnv("MARKETPLACE_MODE", "api");
    vi.stubEnv("MARKETPLACE_CART_ENABLED", "");
    withGuestCart(guestCart);
    vi.mocked(loginCustomer).mockResolvedValue({ token: "7|nuevo", customer });

    await expect(login(INITIAL_FORM_STATE, loginForm(form))).rejects.toThrow("NEXT_REDIRECT:/carrito");

    expect(mergeCart).not.toHaveBeenCalled();
    expect(cartDeleted()).toBe(false);
  });

  it("una mp_cart inválida se borra sin llamar a la API", async () => {
    withGuestCart("no-es-json");
    vi.mocked(loginCustomer).mockResolvedValue({ token: "7|nuevo", customer });

    await expect(login(INITIAL_FORM_STATE, loginForm(form))).rejects.toThrow("NEXT_REDIRECT:/carrito");

    expect(mergeCart).not.toHaveBeenCalled();
    expect(cartDeleted()).toBe(true);
  });
});
