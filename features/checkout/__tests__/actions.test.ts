import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startCheckout } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { payCheckout } from "@/features/checkout/server/actions";
import { INITIAL_CHECKOUT_STATE } from "@/features/checkout/lib/checkoutState";
import { CENTRAL, quote, quoteStore } from "@/features/checkout/__tests__/fixtures/testQuote";

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
  startCheckout: vi.fn(),
  getMe: vi.fn(),
}));

const KEY = "3f1c2a9e-8b7d-4c6a-9e2f-1a2b3c4d5e6f";

function form(fields: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("address_id", "");
  formData.append("store_slug", CENTRAL);
  formData.set(`f-${CENTRAL}`, "pickup");
  formData.set("quote_hash", "hash-1");
  formData.set("idempotency_key", KEY);
  for (const [name, value] of Object.entries(fields)) formData.set(name, value);
  return formData;
}

function signedIn(): void {
  cookieStore.get.mockImplementation((name: string) => (name === "mp_session" ? { name, value: "7|token" } : undefined));
}

const accountError = (status: number, code: MarketplaceAccountError["code"], message: string, extra = {}) =>
  new MarketplaceAccountError({ status, code, message, ...extra });

beforeEach(() => {
  vi.stubEnv("MARKETPLACE_MODE", "mock");
  signedIn();
});

afterEach(() => {
  vi.unstubAllEnvs();
  cookieStore.get.mockReset();
  cookieStore.delete.mockReset();
  vi.mocked(startCheckout).mockReset();
});

describe("payCheckout", () => {
  it("manda lo cotizado y redirige a la pasarela", async () => {
    vi.mocked(startCheckout).mockResolvedValue({
      purchase_code: "PV-000001",
      payment: { provider: "fake", redirect_url: "http://localhost:3000/checkout/resultado?compra=PV-000001", instructions: null },
    });

    await expect(payCheckout(INITIAL_CHECKOUT_STATE, form())).rejects.toThrow(
      "NEXT_REDIRECT:http://localhost:3000/checkout/resultado?compra=PV-000001",
    );
    expect(startCheckout).toHaveBeenCalledWith(expect.objectContaining({ session: "7|token" }), {
      stores: [{ store_slug: CENTRAL, fulfillment: "pickup" }],
      address_id: null,
      quote_hash: "hash-1",
      idempotency_key: KEY,
    });
  });

  it("con la casilla marcada manda bill_to_me y sin ella lo omite", async () => {
    vi.mocked(startCheckout).mockRejectedValue(accountError(422, "billing_incomplete", "x"));

    await payCheckout(INITIAL_CHECKOUT_STATE, form({ bill_to_me: "on" }));
    await payCheckout(INITIAL_CHECKOUT_STATE, form());

    expect(vi.mocked(startCheckout).mock.calls[0][1]).toHaveProperty("bill_to_me", true);
    expect(vi.mocked(startCheckout).mock.calls[1][1]).not.toHaveProperty("bill_to_me");
  });

  it("con instrucciones las devuelve con el código de la compra", async () => {
    vi.mocked(startCheckout).mockResolvedValue({
      purchase_code: "PV-000002",
      payment: { provider: "transferencia", redirect_url: null, instructions: "Transfiere a la cuenta 0102." },
    });

    expect(await payCheckout(INITIAL_CHECKOUT_STATE, form({ address_id: "4" }))).toEqual({
      status: "instructions",
      purchaseCode: "PV-000002",
      instructions: "Transfiere a la cuenta 0102.",
    });
    expect(vi.mocked(startCheckout).mock.calls[0][1].address_id).toBe(4);
  });

  it("quote_changed devuelve la Quote nueva", async () => {
    const changed = quote([quoteStore({ total_usd: "6.00" })], { quote_hash: "hash-2" });
    vi.mocked(startCheckout).mockRejectedValue(
      accountError(409, "quote_changed", "Tu compra cambió. Revisa los precios y la entrega.", { quote: changed }),
    );

    expect(await payCheckout(INITIAL_CHECKOUT_STATE, form())).toEqual({
      status: "quote_changed",
      message: "Tu compra cambió. Revisa los precios y la entrega.",
      quote: changed,
    });
  });

  it.each([
    [accountError(403, "email_unverified", "Verifica tu correo para comprar."), { status: "email_unverified", message: "Verifica tu correo para comprar." }],
    [accountError(422, "billing_incomplete", "Completa tus datos de facturación."), { status: "billing_incomplete", message: "Completa tus datos de facturación." }],
    [accountError(422, "cart_empty", "Tu carrito no tiene productos disponibles."), { status: "cart_empty", message: "Tu carrito no tiene productos disponibles." }],
    [accountError(429, "too_many_attempts", "Demasiados intentos.", { retryAfter: 42 }), { status: "error", message: "Demasiados intentos. Prueba de nuevo en 42 segundos." }],
    [accountError(409, "open_orders", "Texto de la API."), { status: "error", message: "No pudimos iniciar el pago. Intenta de nuevo." }],
    [accountError(422, "validation_failed", "Elige una dirección válida."), { status: "error", message: "Elige una dirección válida." }],
    [accountError(404, "not_found", "La dirección no existe."), { status: "error", message: "La dirección no existe." }],
    [new MarketplaceUnavailableError("/checkout"), { status: "error", message: "No pudimos iniciar el pago. Intenta de nuevo." }],
  ])("mapea %s a su estado", async (error, expected) => {
    vi.mocked(startCheckout).mockRejectedValue(error);

    expect(await payCheckout(INITIAL_CHECKOUT_STATE, form())).toEqual(expected);
  });

  it("un 401 borra la sesión y lleva a entrar con volver al checkout", async () => {
    vi.mocked(startCheckout).mockRejectedValue(accountError(401, "unauthenticated", "Inicia sesión para continuar."));

    await expect(payCheckout(INITIAL_CHECKOUT_STATE, form())).rejects.toThrow("NEXT_REDIRECT:/entrar?volver=%2Fcheckout");
    expect(cookieStore.delete.mock.calls.some(([arg]) => (arg as { name: string }).name === "mp_session")).toBe(true);
  });

  it.each([
    ["una clave que no es UUID v4", { idempotency_key: "no-es-uuid" }],
    ["una entrega desconocida", { [`f-${CENTRAL}`]: "domicilio" }],
    ["sin quote_hash", { quote_hash: "" }],
  ])("con %s no llama a la API", async (_name, fields) => {
    expect(await payCheckout(INITIAL_CHECKOUT_STATE, form(fields))).toEqual({
      status: "error",
      message: "No pudimos iniciar el pago. Intenta de nuevo.",
    });
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it("con el carrito apagado no hace nada", async () => {
    vi.stubEnv("MARKETPLACE_MODE", "api");
    vi.stubEnv("MARKETPLACE_CART_ENABLED", "");

    expect(await payCheckout(INITIAL_CHECKOUT_STATE, form())).toEqual(INITIAL_CHECKOUT_STATE);
    expect(startCheckout).not.toHaveBeenCalled();
  });
});
