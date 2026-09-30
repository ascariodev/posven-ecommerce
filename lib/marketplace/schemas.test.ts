import { beforeEach, describe, expect, it } from "vitest";
import { resetMockAccounts } from "./mock/accounts";
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
  listNearbyStores,
  listSitemap,
  loginCustomer,
  registerCustomer,
  searchProducts,
} from "./mock/adapter";
import { MOCK_STORES } from "./mock/fixtures";
import {
  accountErrorBodySchema,
  addressSchema,
  authResponseSchema,
  categoriesResponseSchema,
  customerSchema,
  eventInputSchema,
  favoritesResponseSchema,
  locationsResponseSchema,
  moneySchema,
  productResponseSchema,
  searchResponseSchema,
  sitemapResponseSchema,
  storeResponseSchema,
  storesResponseSchema,
  storeSummarySchema,
} from "./schemas";

const noFilters = { category: null, geo: null, radiusKm: null, page: 1 } as const;

describe("el simulado pasa los esquemas del contrato", () => {
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
      phone: "+584121112233",
      password: "otra-clave-1",
    });
    expect(authResponseSchema.safeParse(response).success).toBe(true);
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
