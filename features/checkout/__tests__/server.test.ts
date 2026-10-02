import { afterEach, describe, expect, it, vi } from "vitest";
import { listAddresses, quoteCheckout } from "@/lib/marketplace/client";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import type { Address, Cart } from "@/lib/marketplace/schemas";
import { getSessionCart } from "@/features/cart/server/cart";
import { loadCheckout } from "@/features/checkout/server/checkout";
import { ABASTO, CENTRAL, cartStore, quote, quoteStore } from "@/features/checkout/__tests__/fixtures/testQuote";

vi.mock("@/lib/marketplace/client", () => ({
  getCart: vi.fn(),
  listAddresses: vi.fn(),
  quoteCheckout: vi.fn(),
}));

vi.mock("@/features/cart/server/cart", () => ({ getSessionCart: vi.fn() }));

const ctx = { session: "7|token", clientIp: null };

function address(id: number, is_default: boolean): Address {
  return {
    id,
    label: `Dirección ${id}`,
    recipient_name: "Comprador",
    phone: "+584141234567",
    city: { slug: "valencia", name: "Valencia" },
    line: "Av. Bolívar Norte",
    reference: null,
    lat: 10.17,
    lng: -68,
    is_default,
  };
}

function cart(stores = [cartStore(CENTRAL, "Farmacia Central"), cartStore(ABASTO, "Abasto La Esquina")]): Cart {
  return { stores, total_usd: "10.20", total_ves: "372.30", line_count: stores.length, rate: quote([]).rate };
}

afterEach(() => {
  vi.mocked(getSessionCart).mockReset();
  vi.mocked(listAddresses).mockReset();
  vi.mocked(quoteCheckout).mockReset();
});

describe("loadCheckout", () => {
  it("usa la dirección pedida si es del comprador y pide entrega sólo donde se eligió", async () => {
    vi.mocked(getSessionCart).mockResolvedValue(cart());
    vi.mocked(listAddresses).mockResolvedValue([address(1, true), address(2, false)]);
    vi.mocked(quoteCheckout).mockResolvedValue(quote([quoteStore()]));

    const data = await loadCheckout(ctx, { addressId: 2, delivery: [CENTRAL] });

    expect(data.kind === "ready" && data.addressId).toBe(2);
    expect(quoteCheckout).toHaveBeenCalledWith(ctx, {
      stores: [
        { store_slug: CENTRAL, fulfillment: "delivery" },
        { store_slug: ABASTO, fulfillment: "pickup" },
      ],
      address_id: 2,
    });
  });

  it("con una dirección ajena usa la predeterminada", async () => {
    vi.mocked(getSessionCart).mockResolvedValue(cart());
    vi.mocked(listAddresses).mockResolvedValue([address(1, false), address(2, true)]);
    vi.mocked(quoteCheckout).mockResolvedValue(quote([quoteStore()]));

    const data = await loadCheckout(ctx, { addressId: 99, delivery: [] });

    expect(data.kind === "ready" && data.addressId).toBe(2);
  });

  it("sin direcciones pide retiro en todas", async () => {
    vi.mocked(getSessionCart).mockResolvedValue(cart());
    vi.mocked(listAddresses).mockResolvedValue([]);
    vi.mocked(quoteCheckout).mockResolvedValue(quote([quoteStore()]));

    await loadCheckout(ctx, { addressId: null, delivery: [CENTRAL, ABASTO] });

    expect(quoteCheckout).toHaveBeenCalledWith(ctx, {
      stores: [
        { store_slug: CENTRAL, fulfillment: "pickup" },
        { store_slug: ABASTO, fulfillment: "pickup" },
      ],
      address_id: null,
    });
  });

  it("sin líneas disponibles queda vacío sin cotizar", async () => {
    const gone = cartStore(CENTRAL, "Farmacia Central");
    gone.lines = gone.lines.map((line) => ({ ...line, status: "unavailable", unavailable_reason: "offer_gone" }));
    vi.mocked(getSessionCart).mockResolvedValue(cart([gone]));
    vi.mocked(listAddresses).mockResolvedValue([]);

    expect(await loadCheckout(ctx, { addressId: null, delivery: [] })).toEqual({ kind: "empty" });
    expect(quoteCheckout).not.toHaveBeenCalled();
  });

  it("cart_empty de la API queda vacío", async () => {
    vi.mocked(getSessionCart).mockResolvedValue(cart());
    vi.mocked(listAddresses).mockResolvedValue([]);
    vi.mocked(quoteCheckout).mockRejectedValue(
      new MarketplaceAccountError({ status: 422, code: "cart_empty", message: "Tu carrito no tiene productos disponibles." }),
    );

    expect(await loadCheckout(ctx, { addressId: null, delivery: [] })).toEqual({ kind: "empty" });
  });

  it("si la dirección deja de ser válida al cotizar, vuelve a cotizar sin ella", async () => {
    vi.mocked(getSessionCart).mockResolvedValue(cart());
    vi.mocked(listAddresses).mockResolvedValue([address(1, true)]);
    vi.mocked(quoteCheckout)
      .mockRejectedValueOnce(
        new MarketplaceAccountError({ status: 422, code: "validation_failed", message: "Revisa los datos del formulario." }),
      )
      .mockResolvedValueOnce(quote([quoteStore()]));

    const data = await loadCheckout(ctx, { addressId: 1, delivery: [CENTRAL] });

    expect(data.kind === "ready" && data.addressId).toBeNull();
    expect(vi.mocked(quoteCheckout).mock.calls[1][1].address_id).toBeNull();
  });
});
