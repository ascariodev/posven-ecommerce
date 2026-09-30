import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCart } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { Cart } from "@/lib/marketplace/schemas";
import { CartLink } from "./CartLink";

const cookieStore = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers(),
}));

vi.mock("@/lib/marketplace/client", () => ({ getCart: vi.fn(), getMe: vi.fn() }));

function withCookies(values: { session?: string; cart?: string }): void {
  cookieStore.get.mockImplementation((name: string) => {
    if (name === "mp_session" && values.session !== undefined) return { name, value: values.session };
    if (name === "mp_cart" && values.cart !== undefined) return { name, value: values.cart };
    return undefined;
  });
}

function cartWith(lineCount: number): Cart {
  return { stores: [], total_usd: "0.00", total_ves: "0.00", line_count: lineCount, rate: { usd_ves: "36.50", valid_on: "2026-09-26" } };
}

beforeEach(() => {
  vi.stubEnv("MARKETPLACE_MODE", "mock");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  cookieStore.get.mockReset();
  vi.mocked(getCart).mockReset();
});

async function renderLink(): Promise<void> {
  const element = await CartLink();
  if (element !== null) render(element);
}

describe("CartLink", () => {
  it("con sesión muestra line_count", async () => {
    withCookies({ session: "7|token" });
    vi.mocked(getCart).mockResolvedValue(cartWith(2));

    await renderLink();

    expect(screen.getByRole("link", { name: "Carrito, 2 productos" }).getAttribute("href")).toBe("/carrito");
  });

  it("el invitado cuenta las entradas de mp_cart sin llamar a la API", async () => {
    const entries = [
      { store_slug: "farmacia-central-valencia", product_slug: "a", quantity: 3 },
      { store_slug: "abasto-la-esquina", product_slug: "b", quantity: 1 },
    ];
    withCookies({ cart: JSON.stringify(entries) });

    await renderLink();

    expect(screen.getByRole("link", { name: "Carrito, 2 productos" })).toBeTruthy();
    expect(getCart).not.toHaveBeenCalled();
  });

  it.each([
    ["la API caída", new MarketplaceUnavailableError("/me/cart")],
    [
      "un 429",
      new MarketplaceAccountError({ status: 429, code: "too_many_attempts", message: "Demasiados intentos.", retryAfter: 30 }),
    ],
  ])("con %s degrada a Carrito sin número", async (_name, error) => {
    withCookies({ session: "7|token" });
    vi.mocked(getCart).mockRejectedValue(error);

    await renderLink();

    expect(screen.getByRole("link", { name: "Carrito" })).toBeTruthy();
  });

  it("con el interruptor apagado no pinta nada", async () => {
    vi.stubEnv("MARKETPLACE_MODE", "api");
    vi.stubEnv("MARKETPLACE_CART_ENABLED", undefined);

    expect(await CartLink()).toBeNull();
  });
});
