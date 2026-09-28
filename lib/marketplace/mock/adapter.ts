import { searchQuery, storesQuery, type GeoFilter, type RadiusKm } from "../params";
import type {
  CategoryNode,
  FeaturedProduct,
  LocationState,
  NearbyStore,
  SearchItem,
  SearchResponse,
  StoresResponse,
} from "../schemas";
import {
  MOCK_CATEGORIES,
  MOCK_LOCATIONS,
  MOCK_PRODUCTS,
  MOCK_RATE,
  MOCK_STORES,
  type MockProduct,
  type MockStore,
} from "./fixtures";

const SEARCH_PER_PAGE = 20;
const STORES_PER_PAGE = 12;
const MAX_FEATURED = 2;

type Scope =
  | { kind: "none" }
  | { kind: "coords"; radiusKm: number | null }
  | { kind: "city"; city: string };

function readScope(query: URLSearchParams): Scope {
  const city = query.get("city");
  if (city !== null) return { kind: "city", city };
  if (query.has("lat") && query.has("lng")) {
    const radius = query.get("radius_km");
    return { kind: "coords", radiusKm: radius === null ? null : Number(radius) };
  }
  return { kind: "none" };
}

function storeInScope(store: MockStore, scope: Scope): boolean {
  if (scope.kind === "city") return store.summary.city.slug === scope.city;
  if (scope.kind === "coords" && scope.radiusKm !== null) return store.distance_km <= scope.radiusKm;
  return true;
}

function productInScope(item: MockProduct, scope: Scope): boolean {
  if (scope.kind === "city") {
    return item.offers.some((offer) => findStore(offer.store_slug).summary.city.slug === scope.city);
  }
  if (scope.kind === "coords" && scope.radiusKm !== null) return item.nearest_km <= scope.radiusKm;
  return true;
}

function findStore(slug: string): MockStore {
  const store = MOCK_STORES.find((candidate) => candidate.summary.slug === slug);
  if (store === undefined) throw new Error(`Tienda simulada inexistente: ${slug}`);
  return store;
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matchesText(item: MockProduct, term: string): boolean {
  if (term === "") return true;
  const { name, brand, ean } = item.product;
  return [name, brand, ean].some((field) => field !== null && normalize(field).includes(term));
}

function matchesCategory(item: MockProduct, category: string | null): boolean {
  if (category === null) return true;
  const own = item.product.category;
  return own !== null && (own.slug === category || own.parent_slug === category);
}

function pageOf<T>(items: T[], page: number, perPage: number): T[] {
  return items.slice((page - 1) * perPage, page * perPage);
}

function toSearchItem(item: MockProduct, scope: Scope): SearchItem {
  return {
    ...item.product,
    offers_count: item.offers.length,
    min_price_usd: item.min_price_usd,
    min_price_ves: item.min_price_ves,
    nearest_km: scope.kind === "none" ? null : item.nearest_km,
    outside_radius: false,
  };
}

function toFeatured(item: MockProduct, scope: Scope): FeaturedProduct | null {
  for (const offer of item.offers) {
    const store = findStore(offer.store_slug);
    if (!store.summary.is_premium || !storeInScope(store, scope)) continue;
    return {
      product: item.product,
      offer: {
        store: store.summary,
        price_usd: offer.price_usd,
        price_ves: offer.price_ves,
        availability: offer.availability,
        updated_at: offer.updated_at,
        distance_km: scope.kind === "none" ? null : store.distance_km,
      },
    };
  }
  return null;
}

export async function searchProducts(p: {
  q: string;
  category: string | null;
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
}): Promise<SearchResponse> {
  const query = searchQuery(p);
  const scope = readScope(query);
  const term = normalize(query.get("q") ?? "");
  const matches = MOCK_PRODUCTS.filter(
    (item) =>
      matchesText(item, term) &&
      matchesCategory(item, query.get("category")) &&
      productInScope(item, scope),
  );

  const featured: FeaturedProduct[] = [];
  if (p.page === 1) {
    for (const item of matches) {
      if (featured.length === MAX_FEATURED) break;
      const candidate = toFeatured(item, scope);
      if (candidate !== null) featured.push(candidate);
    }
  }
  const featuredSlugs = new Set(featured.map((entry) => entry.product.slug));

  return {
    data: pageOf(matches, p.page, SEARCH_PER_PAGE)
      .filter((item) => !featuredSlugs.has(item.product.slug))
      .map((item) => toSearchItem(item, scope)),
    featured,
    meta: { page: p.page, per_page: SEARCH_PER_PAGE, total: matches.length },
    rate: MOCK_RATE,
  };
}

export async function listNearbyStores(p: {
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
}): Promise<StoresResponse> {
  const scope = readScope(storesQuery(p));
  const matches = MOCK_STORES.filter((store) => storeInScope(store, scope));
  const ordered =
    scope.kind === "none"
      ? [...matches].sort((a, b) => a.summary.name.localeCompare(b.summary.name, "es"))
      : [...matches].sort((a, b) => a.distance_km - b.distance_km);
  const stores: NearbyStore[] = ordered.map((store) => ({
    ...store.summary,
    distance_km: scope.kind === "none" ? null : store.distance_km,
    outside_radius: false,
  }));

  return {
    data: pageOf(stores, p.page, STORES_PER_PAGE),
    featured: p.page === 1 ? stores.filter((store) => store.is_premium).slice(0, MAX_FEATURED) : [],
    meta: { page: p.page, per_page: STORES_PER_PAGE, total: stores.length },
  };
}

export async function listCategories(): Promise<CategoryNode[]> {
  return MOCK_CATEGORIES;
}

export async function listLocations(): Promise<LocationState[]> {
  return MOCK_LOCATIONS;
}
