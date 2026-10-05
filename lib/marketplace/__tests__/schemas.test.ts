import { beforeEach, describe, expect, it } from "vitest";
import { resetMockAccounts } from "@/lib/marketplace/mock/accounts";
import {
  addFavorite,
  createAddress,
  getMe,
  getProduct,
  getStore,
  listCategories,
  listLocations,
  listAddresses,
  listFavorites,
  listNearbyProducts,
  listNearbyStores,
  listSitemap,
  loginCustomer,
  registerCustomer,
  getSuggestions,
  searchProducts,
  updateMe,
} from "@/lib/marketplace/mock/adapter";
import { getCart, mergeCart, quoteGuestCart, resetMockCarts, setCartItem } from "@/lib/marketplace/mock/cart";
import { getPurchase, listPurchases, quoteCheckout, resetMockPurchases, startCheckout } from "@/lib/marketplace/mock/checkout";
import { MOCK_STORES } from "@/lib/marketplace/mock/fixtures";
import {
  accountErrorBodySchema,
  addressSchema,
  authResponseSchema,
  cartItemsSchema,
  cartSchema,
  cartStoreSchema,
  categoriesResponseSchema,
  checkoutInputSchema,
  checkoutStartSchema,
  customerSchema,
  eventInputSchema,
  favoritesResponseSchema,
  locationsResponseSchema,
  moneySchema,
  offerSchema,
  productResponseSchema,
  purchasePageSchema,
  purchaseSchema,
  quoteSchema,
  searchResponseSchema,
  sitemapResponseSchema,
  storeResponseSchema,
  storesResponseSchema,
  storeSummarySchema,
  nearbyProductsResponseSchema,
  suggestionsResponseSchema,
} from "@/lib/marketplace/schemas";

const noFilters = { category: null, geo: null, radiusKm: null, page: 1 } as const;

describe("el simulado pasa los esquemas del contrato", () => {
  it("productos cercanos con y sin ubicación", async () => {
    for (const geo of [null, { city: "valencia" }] as const) {
      const response = await listNearbyProducts({ geo, radiusKm: 10, page: 1 });
      expect(nearbyProductsResponseSchema.safeParse(response).success).toBe(true);
      expect(response).not.toHaveProperty("featured");
    }
  });

  it("búsqueda con término", async () => {
    const response = await searchProducts({ ...noFilters, q: "acetaminofen" });
    expect(searchResponseSchema.safeParse(response).success).toBe(true);
    expect(response.featured.length).toBeGreaterThan(0);
  });

  it("búsqueda sin término", async () => {
    const response = await searchProducts({ ...noFilters, q: "" });
    expect(searchResponseSchema.safeParse(response).success).toBe(true);
  });

  it("búsqueda en una ciudad", async () => {
    const response = await searchProducts({
      ...noFilters,
      q: "",
      geo: { city: "valencia" },
      radiusKm: 10,
    });
    expect(searchResponseSchema.safeParse(response).success).toBe(true);
  });

  it("tiendas", async () => {
    const response = await listNearbyStores({ geo: null, radiusKm: null, page: 1 });
    expect(storesResponseSchema.safeParse(response).success).toBe(true);
  });

  it("categorías", async () => {
    const data = await listCategories();
    expect(categoriesResponseSchema.safeParse({ data }).success).toBe(true);
  });

  it("ubicaciones", async () => {
    const data = await listLocations();
    expect(locationsResponseSchema.safeParse({ data }).success).toBe(true);
  });

  it.each([
    "acetaminofen-500-mg-20-tabletas",
    "jarabe-para-la-tos-120-ml",
    "acetaminofen-500mg-x-20",
  ])("producto %s", async (slug) => {
    const response = await getProduct(slug);
    expect(response).not.toBeNull();
    expect(productResponseSchema.safeParse(response).success).toBe(true);
  });

  it("tienda", async () => {
    const response = await getStore({ slug: "farmacia-central-valencia", page: 1 });
    expect(response).not.toBeNull();
    expect(storeResponseSchema.safeParse(response).success).toBe(true);
  });

  it.each(["products", "stores"] as const)("sitemap de %s", async (type) => {
    const response = await listSitemap({ type, page: 1 });
    expect(sitemapResponseSchema.safeParse(response).success).toBe(true);
  });
});

describe("eventInputSchema", () => {
  it("rechaza product_view con store_slug", () => {
    const event = {
      type: "product_view",
      store_slug: "farmacia-central-valencia",
      product_slug: "acetaminofen-500-mg-20-tabletas",
    };
    expect(eventInputSchema.safeParse(event).success).toBe(false);
  });

  it("rechaza click_call sin store_slug", () => {
    const event = { type: "click_call", store_slug: null, product_slug: null };
    expect(eventInputSchema.safeParse(event).success).toBe(false);
  });

  it("acepta search con query, con category_slug y con ambos, sin tienda ni producto", () => {
    const base = { type: "search", store_slug: null, product_slug: null, results_count: 0 };
    expect(eventInputSchema.safeParse({ ...base, query: "acetaminofen" }).success).toBe(true);
    expect(eventInputSchema.safeParse({ ...base, category_slug: "analgesicos" }).success).toBe(true);
    expect(eventInputSchema.safeParse({ ...base, query: "ibuprofeno", category_slug: "analgesicos", results_count: 12 }).success).toBe(true);
  });

  it("normaliza query: recorta y pasa a minúsculas", () => {
    const event = { type: "search", store_slug: null, product_slug: null, query: "  Acetaminofen 500  ", results_count: 3 };
    expect(eventInputSchema.parse(event).query).toBe("acetaminofen 500");
  });

  it("rechaza search sin query ni category_slug (también con query en blanco)", () => {
    const base = { type: "search", store_slug: null, product_slug: null, results_count: 3 };
    expect(eventInputSchema.safeParse(base).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...base, query: "   ", category_slug: null }).success).toBe(false);
  });

  it("rechaza search sin results_count o con uno negativo o decimal", () => {
    const base = { type: "search", store_slug: null, product_slug: null, query: "tos" };
    expect(eventInputSchema.safeParse(base).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...base, results_count: -1 }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...base, results_count: 1.5 }).success).toBe(false);
  });

  it("rechaza search con tienda o producto y un query de más de 100 caracteres", () => {
    const base = { type: "search", query: "tos", results_count: 1 };
    expect(eventInputSchema.safeParse({ ...base, store_slug: "farmacia", product_slug: null }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...base, store_slug: null, product_slug: "tos-jarabe" }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...base, store_slug: null, product_slug: null, query: "a".repeat(101) }).success).toBe(false);
  });

  it("rechaza query, category_slug o results_count fuera de search", () => {
    const click = { type: "click_call", store_slug: "farmacia", product_slug: null };
    expect(eventInputSchema.safeParse(click).success).toBe(true);
    expect(eventInputSchema.safeParse({ ...click, query: "tos" }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...click, category_slug: "analgesicos" }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...click, results_count: 0 }).success).toBe(false);
  });

  it("add_to_cart exige store_slug y product_slug", () => {
    const base = { type: "add_to_cart", store_slug: "farmacia", product_slug: "tos-jarabe" };
    expect(eventInputSchema.safeParse(base).success).toBe(true);
    expect(eventInputSchema.safeParse({ ...base, product_slug: null }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...base, store_slug: null }).success).toBe(false);
  });

  it("topa store_slug y product_slug en 160 caracteres", () => {
    const base = { type: "add_to_cart", store_slug: "a".repeat(160), product_slug: "b".repeat(160) };
    expect(eventInputSchema.safeParse(base).success).toBe(true);
    expect(eventInputSchema.safeParse({ ...base, store_slug: "a".repeat(161) }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...base, product_slug: "b".repeat(161) }).success).toBe(false);
  });
});

describe("moneySchema", () => {
  it.each(["12.50", "0.00"])("acepta %s", (value) => {
    expect(moneySchema.safeParse(value).success).toBe(true);
  });

  it.each(["12.5", "12,50", "12", "-1.00"])("rechaza %s", (value) => {
    expect(moneySchema.safeParse(value).success).toBe(false);
  });
});

describe("storeSummarySchema", () => {
  const withoutField: Record<string, unknown> = { ...MOCK_STORES[0].summary };
  delete withoutField.accepts_orders;

  it("sin accepts_orders (posveapi aún no lo envía) lo lee como false", () => {
    expect(storeSummarySchema.parse(withoutField).accepts_orders).toBe(false);
  });

  it("con accepts_orders conserva su valor", () => {
    expect(storeSummarySchema.parse({ ...withoutField, accepts_orders: true }).accepts_orders).toBe(true);
  });
});

describe("searchResponseSchema", () => {
  it("rechaza tres destacados", async () => {
    const response = await searchProducts({ ...noFilters, q: "acetaminofen" });
    const featured = response.featured[0];
    const tooMany = { ...response, featured: [featured, featured, featured] };
    expect(searchResponseSchema.safeParse(tooMany).success).toBe(false);
  });
});

describe("el simulado de cuentas pasa los esquemas del contrato", () => {
  const anonymous = { session: null, clientIp: null };

  beforeEach(() => {
    resetMockAccounts();
  });

  async function seededSession() {
    const { token } = await loginCustomer(anonymous, {
      email: "comprador@posven.test",
      password: "clave-segura-1",
    });
    return { session: token, clientIp: null };
  }

  it("login del comprador sembrado", async () => {
    const response = await loginCustomer(anonymous, {
      email: "comprador@posven.test",
      password: "clave-segura-1",
    });
    expect(authResponseSchema.safeParse(response).success).toBe(true);
  });

  it("registro nuevo", async () => {
    const response = await registerCustomer(anonymous, {
      name: "Nueva compradora",
      email: "nueva@posven.test",
      phone: "04121112233",
      password: "otra-clave-1",
      billing: { document_type: "V", document: "12345678", address: "Av. Principal, Valencia", taxpayer_type: "ordinary" },
    });
    expect(authResponseSchema.safeParse(response).success).toBe(true);
  });

  it("perfil con datos de facturación", async () => {
    const ctx = await seededSession();
    const customer = await updateMe(ctx, {
      billing: {
        document_type: "V",
        document: "12345678",
        name: "Comprador de prueba",
        phone: "04141234567",
        address: "Av. Bolívar Norte, edificio Sol, Valencia",
        taxpayer_type: "ordinary",
      },
    });
    expect(customerSchema.safeParse(customer).success).toBe(true);
    expect(customer.billing).not.toBeNull();
  });

  it("perfil", async () => {
    const customer = await getMe(await seededSession());
    expect(customerSchema.safeParse(customer).success).toBe(true);
  });

  it("direcciones listadas y creada", async () => {
    const ctx = await seededSession();
    const created = await createAddress(ctx, {
      label: "Oficina",
      recipient_name: "Comprador de prueba",
      phone: "+584141234567",
      city_slug: "naguanagua",
      line: "Av. Universidad, local 4",
      reference: "Frente a la plaza",
      lat: 10.25,
      lng: -68.01,
    });
    const listed = await listAddresses(ctx);

    expect(addressSchema.safeParse(created).success).toBe(true);
    for (const address of listed) expect(addressSchema.safeParse(address).success).toBe(true);
  });

  it("favoritos con un producto y una tienda", async () => {
    const ctx = await seededSession();
    await addFavorite(ctx, { kind: "product", slug: "acetaminofen-500-mg-20-tabletas" });
    await addFavorite(ctx, { kind: "store", slug: "farmacia-central-valencia" });

    const response = await listFavorites(ctx);

    expect(favoritesResponseSchema.safeParse(response).success).toBe(true);
    expect(response.products).toHaveLength(1);
    expect(response.stores).toHaveLength(1);
  });

  it("cuerpo de error de cuenta", () => {
    const body = {
      error: {
        code: "too_many_attempts",
        message: "Demasiados intentos. Prueba de nuevo en 42 segundos.",
        retry_after: 42,
      },
    };
    expect(accountErrorBodySchema.safeParse(body).success).toBe(true);
  });
});

describe("el simulado del carrito pasa los esquemas del contrato", () => {
  const anonymous = { session: null, clientIp: null };
  const line = { store_slug: "farmacia-central-valencia", product_slug: "acetaminofen-500-mg-20-tabletas", quantity: 1 };

  beforeEach(() => {
    resetMockAccounts();
    resetMockCarts();
  });

  it("cotización de invitado, carrito, PUT y merge", async () => {
    const { token } = await loginCustomer(anonymous, { email: "comprador@posven.test", password: "clave-segura-1" });
    const ctx = { session: token, clientIp: null };
    const offerGone = { store_slug: "farmacia-central-valencia", product_slug: "jarabe-para-la-tos-120-ml", quantity: 1 };
    const responses = [
      await quoteGuestCart(anonymous, []),
      await quoteGuestCart(anonymous, [line, offerGone]),
      await setCartItem(ctx, line),
      await mergeCart(ctx, [offerGone]),
      await getCart(ctx),
    ];
    for (const response of responses) expect(cartSchema.parse(response)).toEqual(response);
  });
});

describe("cartItemsSchema", () => {
  const line = { store_slug: "farmacia-central-valencia", product_slug: "acetaminofen-500-mg-20-tabletas", quantity: 1 };

  it("acepta hasta 20 entradas distintas", () => {
    const items = Array.from({ length: 20 }, (_, index) => ({ ...line, product_slug: `producto-${index}` }));
    expect(cartItemsSchema.safeParse(items).success).toBe(true);
  });

  it.each([
    ["claves de más", [{ ...line, price_usd: "1.00" }]],
    ["entradas repetidas", [line, { ...line, quantity: 2 }]],
    ["slug de más de 120 caracteres", [{ ...line, product_slug: "a".repeat(121) }]],
    ["cantidad 0", [{ ...line, quantity: 0 }]],
    ["cantidad 100", [{ ...line, quantity: 100 }]],
    ["21 entradas", Array.from({ length: 21 }, (_, index) => ({ ...line, product_slug: `producto-${index}` }))],
  ])("rechaza %s", (_name, items) => {
    expect(cartItemsSchema.safeParse(items).success).toBe(false);
  });
});

// Checkout y compras (enmienda F, G y H), escritos a mano: el simulado llega con la Task 2 del 4b.
const rate = { usd_ves: "36.50", valid_on: "2026-09-26" };
const storeSummary = MOCK_STORES[0].summary;

const quote = {
  quote_hash: "hash-opaco",
  stores: [
    {
      store_slug: "farmacia-central-valencia",
      fulfillment: "delivery",
      delivery_available: true,
      delivery_unavailable_reason: null,
      subtotal_usd: "5.00",
      subtotal_ves: "182.50",
      delivery_fee_usd: "1.50",
      delivery_fee_ves: "54.75",
      total_usd: "6.50",
      total_ves: "237.25",
    },
    {
      store_slug: "abasto-la-esquina",
      fulfillment: "pickup",
      delivery_available: false,
      delivery_unavailable_reason: "no_delivery",
      subtotal_usd: "1.20",
      subtotal_ves: "43.80",
      delivery_fee_usd: "0.00",
      delivery_fee_ves: "0.00",
      total_usd: "1.20",
      total_ves: "43.80",
    },
  ],
  total_usd: "7.70",
  total_ves: "281.05",
  charge: { currency: "VES", amount: "281.05" },
  rate,
};

const orderLine = {
  product: { slug: "acetaminofen-500-mg-20-tabletas", name: "Acetaminofén", image_url: null, category: null },
  quantity: 2,
  accepted_quantity: 2,
  unit_usd: "2.50",
  unit_ves: "91.25",
  line_usd: "5.00",
  line_ves: "182.50",
  missing: false,
};

const noTimeline = { paid_at: null, ready_at: null, dispatched_at: null, delivered_at: null, cancelled_at: null };

const paidPurchase = {
  code: "K7M2Q9XA",
  status: "paid",
  created_at: "2026-09-30T14:00:00-04:00",
  paid_at: "2026-09-30T14:00:05-04:00",
  total_usd: "7.70",
  total_ves: "281.05",
  charge: { currency: "VES", amount: "281.05" },
  rate,
  orders: [
    {
      store: storeSummary,
      status: "ready_for_pickup",
      fulfillment: "pickup",
      pickup_code: "R4T9KM",
      address: null,
      lines: [orderLine, { ...orderLine, accepted_quantity: 0, missing: true }],
      subtotal_usd: "10.00",
      subtotal_ves: "365.00",
      delivery_fee_usd: "0.00",
      delivery_fee_ves: "0.00",
      refunded_usd: "5.00",
      refunded_ves: "182.50",
      timeline: { ...noTimeline, paid_at: "2026-09-30T14:00:05-04:00", ready_at: "2026-09-30T14:20:00-04:00" },
    },
    {
      store: storeSummary,
      status: "out_for_delivery",
      fulfillment: "delivery",
      pickup_code: null,
      address: {
        label: "Casa",
        recipient_name: "Comprador",
        phone: "+584141234567",
        city: { slug: "valencia", name: "Valencia" },
        line: "Av. Bolívar Norte",
        reference: null,
      },
      lines: [orderLine],
      subtotal_usd: "5.00",
      subtotal_ves: "182.50",
      delivery_fee_usd: "1.50",
      delivery_fee_ves: "54.75",
      refunded_usd: "0.00",
      refunded_ves: "0.00",
      timeline: { ...noTimeline, paid_at: "2026-09-30T14:00:05-04:00", dispatched_at: "2026-09-30T14:25:00Z" },
    },
  ],
};

describe("contrato de checkout y compras", () => {
  it("una Quote, una compra pagada y una página de compras pasan sus esquemas", () => {
    expect(quoteSchema.safeParse(quote).success).toBe(true);
    expect(purchaseSchema.safeParse(paidPurchase).success).toBe(true);
    expect(
      purchasePageSchema.safeParse({ data: [paidPurchase], meta: { page: 1, per_page: 10, total: 1 } }).success,
    ).toBe(true);
  });

  it("una compra sin pagar lleva sus pedidos en pending_payment (enmienda L)", () => {
    const [order] = paidPurchase.orders;
    const pending = {
      ...paidPurchase,
      status: "pending_payment",
      paid_at: null,
      orders: [{ ...order, status: "pending_payment", pickup_code: null, refunded_usd: "0.00", refunded_ves: "0.00", timeline: noTimeline }],
    };
    expect(purchaseSchema.safeParse(pending).success).toBe(true);
    expect(purchaseSchema.safeParse({ ...pending, orders: [{ ...pending.orders[0], status: "pending" }] }).success).toBe(false);
  });

  it("una fecha sin zona no pasa", () => {
    expect(purchaseSchema.safeParse({ ...paidPurchase, created_at: "2026-09-30T14:00:00" }).success).toBe(false);
  });

  const start = (payment: { redirect_url: string | null; instructions: string | null }) =>
    checkoutStartSchema.safeParse({ purchase_code: "K7M2Q9XA", payment: { provider: "fake", ...payment } }).success;

  it("el inicio del pago trae redirect_url o instructions, uno solo", () => {
    expect(start({ redirect_url: "https://ecom.test/checkout/resultado?compra=K7M2Q9XA", instructions: null })).toBe(true);
    expect(start({ redirect_url: null, instructions: "Transfiere a la cuenta 0102." })).toBe(true);
    expect(start({ redirect_url: null, instructions: null })).toBe(false);
    expect(start({ redirect_url: "https://ecom.test/x", instructions: "y" })).toBe(false);
    expect(start({ redirect_url: "javascript:alert(1)", instructions: null })).toBe(false);
  });

  const checkoutInput = {
    stores: [{ store_slug: "farmacia-central-valencia", fulfillment: "pickup" }],
    address_id: null,
    quote_hash: "hash-opaco",
    idempotency_key: "3f1c2a9e-8b7d-4c6a-9e2f-1a2b3c4d5e6f",
  };

  it("la entrada del checkout acepta una clave UUID v4", () => {
    expect(checkoutInputSchema.safeParse(checkoutInput).success).toBe(true);
  });

  it.each([
    ["una clave que no es UUID v4", { ...checkoutInput, idempotency_key: "3f1c2a9e-8b7d-1c6a-9e2f-1a2b3c4d5e6f" }],
    ["tiendas repetidas", { ...checkoutInput, stores: [...checkoutInput.stores, ...checkoutInput.stores] }],
    ["claves de más", { ...checkoutInput, extra: true }],
    ["sin tiendas", { ...checkoutInput, stores: [] }],
  ])("la entrada del checkout rechaza %s", (_name, input) => {
    expect(checkoutInputSchema.safeParse(input).success).toBe(false);
  });

  it("el cuerpo de error quote_changed trae la Quote nueva", () => {
    const parsed = accountErrorBodySchema.safeParse({
      error: { code: "quote_changed", message: "Tu compra cambió. Revisa los precios y la entrega.", quote },
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.error.quote?.total_usd).toBe("7.70");
  });
});

describe("el simulado de checkout y compras pasa los esquemas del contrato", () => {
  beforeEach(() => {
    resetMockAccounts();
    resetMockCarts();
    resetMockPurchases();
  });

  it("Quote, inicio del pago, compra en cada estado y página de compras", async () => {
    const { token } = await loginCustomer(
      { session: null, clientIp: null },
      { email: "entrega@posven.test", password: "clave-segura-3" },
    );
    const ctx = { session: token, clientIp: null };
    await setCartItem(ctx, { store_slug: "farmacia-central-valencia", product_slug: "acetaminofen-500-mg-20-tabletas", quantity: 1 });
    await setCartItem(ctx, { store_slug: "farmacia-central-valencia", product_slug: "alcohol-isopropilico-250-ml", quantity: 1 });
    const quoteInput = { stores: [{ store_slug: "farmacia-central-valencia", fulfillment: "delivery" as const }], address_id: 2 };

    const quote = await quoteCheckout(ctx, quoteInput);
    expect(quoteSchema.safeParse(quote).success).toBe(true);

    const started = await startCheckout(ctx, { ...quoteInput, quote_hash: quote.quote_hash, idempotency_key: crypto.randomUUID() });
    expect(checkoutStartSchema.safeParse(started).success).toBe(true);

    for (const status of ["pending_payment", "paid", "paid"]) {
      const purchase = await getPurchase(ctx, started.purchase_code);
      expect(purchase.status).toBe(status);
      expect(purchaseSchema.safeParse(purchase).success).toBe(true);
    }
    expect(purchasePageSchema.safeParse(await listPurchases(ctx, 1)).success).toBe(true);
  });
});

describe("closes_at en cartStoreSchema", () => {
  const store = {
    store: MOCK_STORES[0].summary,
    is_open: true,
    accepts_orders: true,
    offers_delivery: false,
    lines: [
      {
        product: { slug: "a", name: "A", image_url: null, category: null },
        quantity: 1,
        price_usd: "1.00",
        price_ves: "36.50",
        line_usd: "1.00",
        line_ves: "36.50",
        availability: "available",
        status: "ok",
        unavailable_reason: null,
      },
    ],
    subtotal_usd: "1.00",
    subtotal_ves: "36.50",
  };

  it("es opcional y admite HH:MM o nulo", () => {
    expect(cartStoreSchema.safeParse(store).success).toBe(true);
    expect(cartStoreSchema.safeParse({ ...store, closes_at: "20:00" }).success).toBe(true);
    expect(cartStoreSchema.safeParse({ ...store, closes_at: null }).success).toBe(true);
  });

  it("rechaza una hora mal formada", () => {
    expect(cartStoreSchema.safeParse({ ...store, closes_at: "8pm" }).success).toBe(false);
  });

  it("fulfillment, delivery_fee_* y total_* son opcionales y se validan si vienen", () => {
    const delivery = { fulfillment: "delivery", delivery_fee_usd: "1.50", delivery_fee_ves: "54.75", total_usd: "2.50", total_ves: "91.25" };
    expect(cartStoreSchema.safeParse({ ...store, ...delivery }).success).toBe(true);
    expect(cartStoreSchema.safeParse({ ...store, ...delivery, delivery_fee_usd: null, delivery_fee_ves: null }).success).toBe(true);
    expect(cartStoreSchema.safeParse({ ...store, fulfillment: "courier" }).success).toBe(false);
    expect(cartStoreSchema.safeParse({ ...store, total_usd: "2.5" }).success).toBe(false);
  });
});

describe("is_open y closes_at", () => {
  const offer = {
    store: MOCK_STORES[0].summary,
    price_usd: "1.00",
    price_ves: "36.50",
    availability: "available",
    updated_at: "2026-09-26T14:30:00Z",
    distance_km: null,
  };

  it("son opcionales en la oferta", () => {
    expect(offerSchema.safeParse(offer).success).toBe(true);
    expect(offerSchema.safeParse({ ...offer, is_open: true, closes_at: "20:00" }).success).toBe(true);
    expect(offerSchema.safeParse({ ...offer, is_open: false, closes_at: null }).success).toBe(true);
  });

  it("rechazan una hora mal formada y un is_open que no es booleano", () => {
    expect(offerSchema.safeParse({ ...offer, closes_at: "8pm" }).success).toBe(false);
    expect(offerSchema.safeParse({ ...offer, is_open: "1" }).success).toBe(false);
  });

  it("el simulado los trae en búsqueda, ficha y tiendas", async () => {
    const search = await searchProducts({ ...noFilters, q: "acetaminofen" });
    expect(typeof search.featured[0].offer.is_open).toBe("boolean");
    const stores = await listNearbyStores({ geo: null, radiusKm: null, page: 1 });
    expect(stores.data.every((store) => typeof store.is_open === "boolean")).toBe(true);
    const page = productResponseSchema.parse(await getProduct("acetaminofen-500-mg-20-tabletas"));
    expect("offers" in page && page.offers.every((entry) => typeof entry.is_open === "boolean")).toBe(true);
  });
});

describe("suggestionsResponseSchema", () => {
  it("la respuesta simulada con término pasa el esquema", async () => {
    const response = await getSuggestions({ q: "acetaminofen", geo: null, radiusKm: null });
    expect(suggestionsResponseSchema.safeParse(response).success).toBe(true);
    expect(response.products.length).toBeGreaterThan(0);
  });

  it("rechaza cinco productos", async () => {
    const response = await getSuggestions({ q: "acetaminofen", geo: null, radiusKm: null });
    const product = response.products[0];
    expect(suggestionsResponseSchema.safeParse({ ...response, products: Array(5).fill(product) }).success).toBe(false);
  });
});
