export const RADIUS_OPTIONS = [3, 10, 25, 50] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS)[number];
export const DEFAULT_RADIUS_KM: RadiusKm = 10;
export const NATIONWIDE = "pais";

export type GeoFilter = { lat: number; lng: number } | { city: string } | null;

function appendLocation(query: URLSearchParams, geo: GeoFilter, radiusKm: RadiusKm | null): void {
  if (geo === null) return;
  if ("city" in geo) {
    if (radiusKm !== null) query.set("city", geo.city);
    return;
  }
  query.set("lat", String(geo.lat));
  query.set("lng", String(geo.lng));
  if (radiusKm !== null) query.set("radius_km", String(radiusKm));
}

export type OfferSort = "price" | "distance";

export function searchQuery(p: {
  q: string;
  category: string | null;
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
  sort?: OfferSort;
  openNow?: boolean;
}): URLSearchParams {
  const query = new URLSearchParams();
  if (p.q !== "") query.set("q", p.q);
  if (p.category !== null) query.set("category", p.category);
  appendLocation(query, p.geo, p.radiusKm);
  if (p.sort !== undefined) query.set("sort", p.sort);
  if (p.openNow === true) query.set("open_now", "true");
  query.set("page", String(p.page));
  return query;
}

export function suggestionsQuery(p: {
  q: string;
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
}): URLSearchParams {
  const query = new URLSearchParams();
  query.set("q", p.q);
  appendLocation(query, p.geo, p.radiusKm);
  return query;
}

export function storesQuery(p: {
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
}): URLSearchParams {
  const query = new URLSearchParams();
  appendLocation(query, p.geo, p.radiusKm);
  query.set("page", String(p.page));
  return query;
}

export function nearbyProductsQuery(p: {
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
  openNow?: boolean;
}): URLSearchParams {
  const query = new URLSearchParams();
  appendLocation(query, p.geo, p.radiusKm);
  if (p.openNow === true) query.set("open_now", "true");
  query.set("page", String(p.page));
  return query;
}

export function productQuery(p: {
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  sort: OfferSort;
}): URLSearchParams {
  const query = new URLSearchParams();
  appendLocation(query, p.geo, p.radiusKm);
  query.set("sort", p.sort);
  return query;
}

export function pageQuery(page: number): URLSearchParams {
  return new URLSearchParams({ page: String(page) });
}

export function cartFulfillmentQuery(deliveryStores: string[]): URLSearchParams {
  const query = new URLSearchParams();
  for (const slug of deliveryStores) query.set(`fulfillment[${slug}]`, "delivery");
  return query;
}

export function cartFulfillmentBody(deliveryStores: string[]): { fulfillment?: Record<string, "delivery"> } {
  if (deliveryStores.length === 0) return {};
  return { fulfillment: Object.fromEntries(deliveryStores.map((slug) => [slug, "delivery" as const])) };
}

export type AccountContext = { session: string | null; clientIp: string | null };

export type FavoriteTarget = { kind: "product" | "store"; slug: string };
