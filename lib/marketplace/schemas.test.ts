import { describe, expect, it } from "vitest";
import { listCategories, listLocations, listNearbyStores, searchProducts } from "./mock/adapter";
import {
  categoriesResponseSchema,
  locationsResponseSchema,
  moneySchema,
  searchResponseSchema,
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
