export const RADIUS_OPTIONS = [3, 10, 25, 50] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS)[number];
export const DEFAULT_RADIUS_KM: RadiusKm = 10;

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

export function searchQuery(p: {
  q: string;
  category: string | null;
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
}): URLSearchParams {
  const query = new URLSearchParams();
  if (p.q !== "") query.set("q", p.q);
  if (p.category !== null) query.set("category", p.category);
  appendLocation(query, p.geo, p.radiusKm);
  query.set("page", String(p.page));
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
