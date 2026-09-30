import type { CartStore, Quote, QuoteStore } from "@/lib/marketplace/schemas";

// Datos de prueba del checkout: montos que no salen de sumar (5,10 + 1,70 ≠ 7,00), para que una
// prueba note si el componente calculara algo.

export const CENTRAL = "farmacia-central-valencia";
export const ABASTO = "abasto-la-esquina";

export function quoteStore(overrides: Partial<QuoteStore> = {}): QuoteStore {
  return {
    store_slug: CENTRAL,
    fulfillment: "pickup",
    delivery_available: true,
    delivery_unavailable_reason: null,
    subtotal_usd: "5.10",
    subtotal_ves: "186.15",
    delivery_fee_usd: "0.00",
    delivery_fee_ves: "0.00",
    total_usd: "5.10",
    total_ves: "186.15",
    ...overrides,
  };
}

export function quote(stores: QuoteStore[], overrides: Partial<Quote> = {}): Quote {
  return {
    quote_hash: "hash-1",
    stores,
    total_usd: "7.00",
    total_ves: "255.55",
    charge: { currency: "VES", amount: "255.60" },
    rate: { usd_ves: "36.50", valid_on: "2026-09-26" },
    ...overrides,
  };
}

export function cartStore(slug: string, name: string): CartStore {
  return {
    store: {
      slug,
      name,
      logo_url: null,
      address: "Av. Bolívar Norte",
      city: { slug: "valencia", name: "Valencia" },
      latitude: 10.18,
      longitude: -68,
      phone: null,
      whatsapp: null,
      is_premium: false,
      accepts_orders: true,
    },
    is_open: true,
    accepts_orders: true,
    offers_delivery: slug === CENTRAL,
    lines: [
      {
        product: { slug: `producto-${slug}`, name: `Producto de ${name}`, image_url: null, category: null },
        quantity: 2,
        price_usd: "2.50",
        price_ves: "91.25",
        line_usd: "5.10",
        line_ves: "186.15",
        availability: "available",
        status: "ok",
        unavailable_reason: null,
      },
    ],
    subtotal_usd: "5.10",
    subtotal_ves: "186.15",
  };
}
