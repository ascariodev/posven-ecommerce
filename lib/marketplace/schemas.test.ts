import { describe, expect, it } from "vitest";
import {
  getProduct,
  getStore,
  listCategories,
  listLocations,
  listNearbyStores,
  listSitemap,
  searchProducts,
} from "./mock/adapter";
import {
  categoriesResponseSchema,
  eventInputSchema,
  locationsResponseSchema,
  moneySchema,
  productResponseSchema,
  searchResponseSchema,
  sitemapResponseSchema,
  storeResponseSchema,
  storesResponseSchema,
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

describe("searchResponseSchema", () => {
  it("rechaza tres destacados", async () => {
    const response = await searchProducts({ ...noFilters, q: "acetaminofen" });
    const featured = response.featured[0];
    const tooMany = { ...response, featured: [featured, featured, featured] };
    expect(searchResponseSchema.safeParse(tooMany).success).toBe(false);
  });
});
