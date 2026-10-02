import { describe, expect, it } from "vitest";
import type { ProductPage, ProductResponse } from "@/lib/marketplace/schemas";
import { getProduct, getProductOffers, getStore, listNearbyStores, searchProducts } from "@/lib/marketplace/mock/adapter";

describe("adaptador simulado", () => {
  it("la búsqueda no distingue mayúsculas ni acentos", async () => {
    const base = { category: null, geo: null, radiusKm: null, page: 1 };
    const upper = await searchProducts({ ...base, q: "ACETAMINOFEN" });
    const accented = await searchProducts({ ...base, q: "acetaminofén" });

    expect(upper.meta.total).toBeGreaterThanOrEqual(3);
    expect(accented).toEqual(upper);
  });

  it("featured queda vacío en la página 2", async () => {
    const response = await searchProducts({
      q: "",
      category: null,
      geo: null,
      radiusKm: null,
      page: 2,
    });

    expect(response.featured).toEqual([]);
  });

  it("con la ciudad caracas sólo devuelve tiendas de Caracas", async () => {
    const response = await listNearbyStores({ geo: { city: "caracas" }, radiusKm: 10, page: 1 });

    expect(response.data.length).toBeGreaterThan(0);
    for (const store of response.data) expect(store.city.slug).toBe("caracas");
  });
});

describe("producto simulado", () => {
  const slug = "acetaminofen-500-mg-20-tabletas";

  function storeSlugs(offers: { store: { slug: string } }[]): string[] {
    return offers.map((offer) => offer.store.slug);
  }

  async function page(response: Promise<ProductResponse | null>): Promise<ProductPage> {
    const resolved = await response;
    if (resolved === null || "redirect_to" in resolved) throw new Error("se esperaba la página");
    return resolved;
  }

  it("sin ubicación resume todas las ofertas y separa las premium", async () => {
    const response = await page(getProduct(slug));

    expect(response.data.offers_summary).toEqual({
      offer_count: 4,
      low_price_usd: "2.35",
      high_price_usd: "2.80",
    });
    expect(storeSlugs(response.featured)).toEqual(["farmacia-central-valencia", "farmacia-altamira"]);
    expect(storeSlugs(response.offers)).toEqual(["farmacia-naguanagua", "abasto-la-esquina"]);
    const all = [...storeSlugs(response.featured), ...storeSlugs(response.offers)];
    expect(new Set(all).size).toBe(all.length);
  });

  it("con la ciudad naguanagua completa hasta tres con ofertas de fuera", async () => {
    const response = await page(
      getProductOffers({ slug, geo: { city: "naguanagua" }, radiusKm: 10, sort: "price" }),
    );

    expect(response.featured.length + response.offers.length).toBe(3);
    const outside = response.offers.filter((offer) => offer.outside_radius);
    expect(outside.length).toBeGreaterThan(0);
    for (const offer of outside) expect(offer.store.city.slug).not.toBe("naguanagua");
  });

  it("con coordenadas sin radio y orden por distancia ordena las no destacadas por cercanía", async () => {
    const response = await page(
      getProductOffers({ slug, geo: { lat: 10.18, lng: -68.0 }, radiusKm: null, sort: "distance" }),
    );

    expect(storeSlugs(response.offers)).toEqual(["abasto-la-esquina", "farmacia-naguanagua"]);
  });

  it("el slug viejo redirige al nuevo", async () => {
    expect(await getProduct("acetaminofen-500mg-x-20")).toEqual({ redirect_to: slug });
  });

  it("un slug desconocido da null", async () => {
    expect(await getProduct("no-existe")).toBeNull();
  });

  it("una tienda desconocida da null", async () => {
    expect(await getStore({ slug: "no-existe", page: 1 })).toBeNull();
  });
});
