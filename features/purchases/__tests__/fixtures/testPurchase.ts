import type { Purchase, StoreOrder, StoreOrderLine } from "@/lib/marketplace/schemas";

// Datos de prueba de compras: el reembolso y el envío no salen de restar ni sumar los otros montos,
// para que una prueba note si el componente calculara algo.

export function orderLine(overrides: Partial<StoreOrderLine> = {}): StoreOrderLine {
  return {
    product: { slug: "acetaminofen-500-mg-20-tabletas", name: "Acetaminofén 500 mg", image_url: null, category: null },
    quantity: 2,
    accepted_quantity: 2,
    unit_usd: "2.50",
    unit_ves: "91.25",
    line_usd: "5.10",
    line_ves: "186.15",
    missing: false,
    ...overrides,
  };
}

export function order(overrides: Partial<StoreOrder> = {}): StoreOrder {
  return {
    store: {
      slug: "farmacia-central-valencia",
      name: "Farmacia Central",
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
    status: "ready_for_pickup",
    fulfillment: "pickup",
    pickup_code: "482913",
    address: null,
    lines: [orderLine()],
    subtotal_usd: "6.70",
    subtotal_ves: "244.55",
    delivery_fee_usd: "0.00",
    delivery_fee_ves: "0.00",
    refunded_usd: "0.00",
    refunded_ves: "0.00",
    timeline: {
      paid_at: "2026-09-30T18:00:05Z",
      ready_at: "2026-09-30T18:20:00Z",
      dispatched_at: null,
      delivered_at: null,
      cancelled_at: null,
    },
    ...overrides,
  };
}

export function purchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    code: "PV-00000A",
    status: "paid",
    created_at: "2026-09-30T18:00:00Z",
    paid_at: "2026-09-30T18:00:05Z",
    total_usd: "6.70",
    total_ves: "244.55",
    charge: { currency: "VES", amount: "244.60" },
    rate: { usd_ves: "36.50", valid_on: "2026-09-26" },
    orders: [order()],
    ...overrides,
  };
}
