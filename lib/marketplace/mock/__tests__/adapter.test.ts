import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProductPage, ProductResponse } from "@/lib/marketplace/schemas";
import { getProduct, getProductOffers, getStore, getSuggestions, listNearbyProducts, listNearbyStores, searchProducts } from "@/lib/marketplace/mock/adapter";

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

  it("cover_url llega sólo en tiendas premium con portada y es nulo en el resto", async () => {
    const response = await listNearbyStores({ geo: null, radiusKm: null, page: 1 });
    const bySlug = new Map(response.data.map((store) => [store.slug, store]));

    expect(bySlug.get("farmacia-central-valencia")?.cover_url).toMatch(/^data:image\/svg\+xml,/);
    expect(bySlug.get("farmacia-altamira")?.cover_url).toBeNull();
    expect(bySlug.get("ferreteria-el-tornillo")?.cover_url).toBeNull();
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

  it("sin ubicación marca como mejor precio la oferta más barata aunque no sea destacada", async () => {
    const response = await page(getProduct(slug));
    const all = [...response.featured, ...response.offers];

    const best = all.filter((offer) => offer.is_best_price === true);
    expect(storeSlugs(best)).toEqual(["farmacia-naguanagua"]);
    expect(response.featured.every((offer) => offer.is_best_price === false)).toBe(true);
  });

  it("con radio el mejor precio sale de las ofertas de dentro y nunca de las de fuera", async () => {
    const response = await page(
      getProductOffers({ slug, geo: { lat: 10.18, lng: -68.0 }, radiusKm: 3, sort: "price" }),
    );

    expect(storeSlugs(response.featured)).toEqual(["farmacia-central-valencia"]);
    expect(response.featured[0].is_best_price).toBe(true);
    const outside = response.offers.filter((offer) => offer.outside_radius);
    expect(outside.length).toBeGreaterThan(0);
    for (const offer of outside) expect(offer.is_best_price).toBe(false);
  });

  it("las ofertas de /search no traen is_best_price", async () => {
    const response = await searchProducts({ q: "", category: null, geo: null, radiusKm: null, page: 1 });

    for (const entry of response.featured) expect(entry.offer).not.toHaveProperty("is_best_price");
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

describe("horario y orden simulados", () => {
  const base = { q: "", category: null, geo: null, radiusKm: null, page: 1 };
  const SUNDAY_10_CARACAS = new Date("2026-10-04T14:00:00Z");
  const MONDAY_6_CARACAS = new Date("2026-10-05T10:00:00Z");

  afterEach(() => {
    vi.useRealTimers();
  });

  it("las tiendas llevan is_open y closes_at calculados del horario", async () => {
    vi.useFakeTimers({ now: SUNDAY_10_CARACAS });
    const response = await listNearbyStores({ geo: null, radiusKm: null, page: 1 });
    const central = response.data.find((store) => store.slug === "farmacia-central-valencia");
    const shop = response.data.find((store) => store.slug === "ferreteria-el-tornillo");
    expect(central).toMatchObject({ is_open: true, closes_at: "13:00" });
    expect(shop).toMatchObject({ is_open: false, closes_at: null });
  });

  it("la tienda lleva is_open y closes_at calculados del horario", async () => {
    vi.useFakeTimers({ now: SUNDAY_10_CARACAS });
    const open = await getStore({ slug: "farmacia-central-valencia", page: 1 });
    expect(open?.data).toMatchObject({ is_open: true, closes_at: "13:00" });
    const closed = await getStore({ slug: "ferreteria-el-tornillo", page: 1 });
    expect(closed?.data).toMatchObject({ is_open: false, closes_at: null });
  });

  it("las ofertas de la ficha llevan is_open y closes_at", async () => {
    vi.useFakeTimers({ now: MONDAY_6_CARACAS });
    const response = await getProduct("acetaminofen-500-mg-20-tabletas");
    const page = response as ProductPage;
    const central = page.featured.find((offer) => offer.store.slug === "farmacia-central-valencia");
    expect(central).toMatchObject({ is_open: false, closes_at: "20:00" });
  });

  it("open_now deja sólo ofertas de tiendas abiertas y reduce el total", async () => {
    vi.useFakeTimers({ now: SUNDAY_10_CARACAS });
    const all = await searchProducts(base);
    const open = await searchProducts({ ...base, openNow: true });
    expect(open.meta.total).toBeLessThan(all.meta.total);
    expect(open.meta.total).toBeGreaterThan(0);
    for (const entry of open.featured) expect(entry.offer.is_open).toBe(true);
  });

  it("open_now deja sólo productos con una tienda abierta y sus ofertas abiertas", async () => {
    vi.useFakeTimers({ now: SUNDAY_10_CARACAS });
    const all = await listNearbyProducts({ geo: null, radiusKm: null, page: 1 });
    const open = await listNearbyProducts({ geo: null, radiusKm: null, page: 1, openNow: true });
    expect(open.meta.total).toBeLessThan(all.meta.total);
    expect(open.meta.total).toBeGreaterThan(0);
  });

  it("open_now con todas las tiendas cerradas no devuelve nada en productos cercanos", async () => {
    vi.useFakeTimers({ now: MONDAY_6_CARACAS });
    const open = await listNearbyProducts({ geo: null, radiusKm: null, page: 1, openNow: true });
    expect(open.meta.total).toBe(0);
    expect(open.data).toEqual([]);
  });

  it("open_now con todas las tiendas cerradas no devuelve nada", async () => {
    vi.useFakeTimers({ now: MONDAY_6_CARACAS });
    const open = await searchProducts({ ...base, openNow: true });
    expect(open.meta.total).toBe(0);
    expect(open.data).toEqual([]);
    expect(open.featured).toEqual([]);
  });

  it("sort=price ordena por precio mínimo ascendente", async () => {
    const response = await searchProducts({ ...base, sort: "price" });
    const prices = [...response.featured.map((entry) => entry.product.slug), ...response.data.map((item) => item.slug)];
    expect(prices.length).toBeGreaterThan(1);
    const minimums = response.data.map((item) => Number(item.min_price_usd));
    expect(minimums).toEqual([...minimums].sort((a, b) => a - b));
  });

  it("sort=distance sin ubicación cae a precio", async () => {
    const byDistance = await searchProducts({ ...base, sort: "distance" });
    const byPrice = await searchProducts({ ...base, sort: "price" });
    expect(byDistance).toEqual(byPrice);
  });

  it("sort=distance con ubicación ordena por cercanía", async () => {
    const response = await searchProducts({
      ...base,
      geo: { lat: 10.18, lng: -68.0 },
      sort: "distance",
    });
    const nearest = response.data.map((item) => item.nearest_km ?? 0);
    expect(nearest).toEqual([...nearest].sort((a, b) => a - b));
  });
});

describe("sugerencias simuladas", () => {
  const base = { geo: null, radiusKm: null } as const;

  it("respeta los topes de términos, productos y categorías", async () => {
    const response = await getSuggestions({ ...base, q: "a" });
    expect(response).toEqual({ terms: [], products: [], categories: [], rate: response.rate });

    const found = await getSuggestions({ ...base, q: "ta" });
    expect(found.terms.length).toBeLessThanOrEqual(5);
    expect(found.products.length).toBeLessThanOrEqual(4);
    expect(found.categories.length).toBeLessThanOrEqual(2);
  });

  it("no distingue mayúsculas ni acentos y no repite términos", async () => {
    const upper = await getSuggestions({ ...base, q: "ACETAMINOFÉN" });
    const lower = await getSuggestions({ ...base, q: "acetaminofen" });
    expect(upper).toEqual(lower);
    expect(new Set(lower.terms).size).toBe(lower.terms.length);
    expect(lower.terms.length).toBeGreaterThan(0);
  });

  it("sin coincidencias devuelve listas vacías", async () => {
    const response = await getSuggestions({ ...base, q: "zzzzzz" });
    expect(response.terms).toEqual([]);
    expect(response.products).toEqual([]);
    expect(response.categories).toEqual([]);
  });

  it("con una ciudad sólo sugiere productos con oferta allí", async () => {
    const all = await getSuggestions({ ...base, q: "ta" });
    const caracas = await getSuggestions({ geo: { city: "caracas" }, radiusKm: 10, q: "ta" });
    expect(caracas.products.length).toBeLessThanOrEqual(all.products.length);
  });
});

describe("productos cercanos simulados", () => {
  it("con coordenadas ordena por cercanía y acota por radio", async () => {
    const response = await listNearbyProducts({ geo: { lat: 10.18, lng: -68.01 }, radiusKm: 3, page: 1 });
    const distances = response.data.map((item) => item.nearest_km);
    expect(distances.every((km) => km !== null && km <= 3)).toBe(true);
    expect(distances).toEqual([...distances].sort((a, b) => (a ?? 0) - (b ?? 0)));
  });

  it("sin ubicación ordena por precio y no trae distancia", async () => {
    const response = await listNearbyProducts({ geo: null, radiusKm: null, page: 1 });
    const prices = response.data.map((item) => Number(item.min_price_usd));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(response.data.every((item) => item.nearest_km === null)).toBe(true);
  });

  it("pagina de a 20 y no trae destacados", async () => {
    const page = await listNearbyProducts({ geo: null, radiusKm: null, page: 1 });
    expect(page.meta.per_page).toBe(20);
    expect(page.data.length).toBeLessThanOrEqual(20);
    expect(page).not.toHaveProperty("featured");
  });

  it("la página 2 sigue a la 1 sin repetir productos", async () => {
    const first = await listNearbyProducts({ geo: null, radiusKm: null, page: 1 });
    const second = await listNearbyProducts({ geo: null, radiusKm: null, page: 2 });
    const firstSlugs = first.data.map((item) => item.slug);
    expect(second.meta).toEqual({ page: 2, per_page: 20, total: first.meta.total });
    expect(second.data).toHaveLength(Math.max(0, first.meta.total - 20));
    expect(second.data.some((item) => firstSlugs.includes(item.slug))).toBe(false);
  });

  it("con la ciudad caracas ordena por cercanía y acota a sus productos", async () => {
    const all = await listNearbyProducts({ geo: null, radiusKm: null, page: 1 });
    const response = await listNearbyProducts({ geo: { city: "caracas" }, radiusKm: 10, page: 1 });
    const distances = response.data.map((item) => item.nearest_km);
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.meta.total).toBeLessThanOrEqual(all.meta.total);
    expect(distances.every((km) => km !== null)).toBe(true);
    expect(distances).toEqual([...distances].sort((a, b) => (a ?? 0) - (b ?? 0)));
  });
});
