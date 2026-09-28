import {
  productQuery,
  searchQuery,
  storesQuery,
  type GeoFilter,
  type OfferSort,
  type RadiusKm,
} from "../params";
import type {
  CategoryNode,
  FeaturedProduct,
  LocationState,
  MarketplaceEvent,
  NearbyStore,
  Offer,
  OffersSummary,
  ProductOffer,
  ProductResponse,
  SearchItem,
  SearchResponse,
  SitemapResponse,
  SitemapType,
  StoreProduct,
  StoreResponse,
  StoresResponse,
} from "../schemas";
import {
  MOCK_CATEGORIES,
  MOCK_LOCATIONS,
  MOCK_PRODUCTS,
  MOCK_RATE,
  MOCK_REDIRECTS,
  MOCK_STORE_DETAILS,
  MOCK_STORES,
  MOCK_UNAVAILABLE_PRODUCTS,
  type MockOffer,
  type MockProduct,
  type MockStore,
} from "./fixtures";

const SEARCH_PER_PAGE = 20;
const STORES_PER_PAGE = 12;
const STORE_PRODUCTS_PER_PAGE = 20;
const SITEMAP_PER_PAGE = 50000;
const SITEMAP_UPDATED_AT = "2026-09-26T14:30:00Z";
const MAX_FEATURED = 2;
const MAX_OFFERS = 50;
const MIN_OFFERS_IN_SCOPE = 3;

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

function toOffer(offer: MockOffer, store: MockStore, scope: Scope): Offer {
  return {
    store: store.summary,
    price_usd: offer.price_usd,
    price_ves: offer.price_ves,
    availability: offer.availability,
    updated_at: offer.updated_at,
    distance_km: scope.kind === "none" ? null : store.distance_km,
  };
}

function toFeatured(item: MockProduct, scope: Scope): FeaturedProduct | null {
  for (const offer of item.offers) {
    const store = findStore(offer.store_slug);
    if (!store.summary.is_premium || !storeInScope(store, scope)) continue;
    return { product: item.product, offer: toOffer(offer, store, scope) };
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

type StoreOffer = { offer: MockOffer; store: MockStore };

function compareNumbers(a: number, b: number): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function comparePrice(a: StoreOffer, b: StoreOffer): number {
  return compareNumbers(Number(a.offer.price_usd), Number(b.offer.price_usd));
}

function compareDistance(a: StoreOffer, b: StoreOffer): number {
  return compareNumbers(a.store.distance_km, b.store.distance_km);
}

function summarize(offers: MockOffer[]): OffersSummary {
  let low: MockOffer | null = null;
  let high: MockOffer | null = null;
  for (const offer of offers) {
    if (low === null || Number(offer.price_usd) < Number(low.price_usd)) low = offer;
    if (high === null || Number(offer.price_usd) > Number(high.price_usd)) high = offer;
  }
  return {
    offer_count: offers.length,
    low_price_usd: low === null ? null : low.price_usd,
    high_price_usd: high === null ? null : high.price_usd,
  };
}

function productPage(
  slug: string,
  p: { geo: GeoFilter; radiusKm: RadiusKm | null; sort: OfferSort },
): ProductResponse | null {
  if (Object.hasOwn(MOCK_REDIRECTS, slug)) return { redirect_to: MOCK_REDIRECTS[slug] };

  const unavailable = MOCK_UNAVAILABLE_PRODUCTS.find((product) => product.slug === slug);
  if (unavailable !== undefined) {
    return {
      data: { ...unavailable, offers_summary: summarize([]) },
      featured: [],
      offers: [],
      rate: MOCK_RATE,
    };
  }

  const item = MOCK_PRODUCTS.find((candidate) => candidate.product.slug === slug);
  if (item === undefined) return null;

  const query = productQuery(p);
  const scope = readScope(query);
  const byDistance = query.get("sort") === "distance" && scope.kind !== "none";
  const ordered = item.offers
    .map((offer) => ({ offer, store: findStore(offer.store_slug) }))
    .sort((a, b) =>
      byDistance
        ? compareDistance(a, b) || comparePrice(a, b)
        : comparePrice(a, b) || compareDistance(a, b),
    );

  const inScope = ordered.filter((entry) => storeInScope(entry.store, scope));
  const featured = inScope.filter((entry) => entry.store.summary.is_premium).slice(0, MAX_FEATURED);
  const rest = inScope.filter((entry) => !featured.includes(entry));
  const bounded = scope.kind === "city" || (scope.kind === "coords" && scope.radiusKm !== null);
  const outside =
    bounded && inScope.length < MIN_OFFERS_IN_SCOPE
      ? ordered
          .filter((entry) => !inScope.includes(entry))
          .sort(compareDistance)
          .slice(0, MIN_OFFERS_IN_SCOPE - inScope.length)
      : [];

  const toProductOffer = (entry: StoreOffer, outsideRadius: boolean): ProductOffer => ({
    ...toOffer(entry.offer, entry.store, scope),
    outside_radius: outsideRadius,
  });

  return {
    data: { ...item.product, offers_summary: summarize(item.offers) },
    featured: featured.map((entry) => toProductOffer(entry, false)),
    offers: [
      ...rest.map((entry) => toProductOffer(entry, false)),
      ...outside.map((entry) => toProductOffer(entry, true)),
    ].slice(0, MAX_OFFERS),
    rate: MOCK_RATE,
  };
}

export async function getProduct(slug: string): Promise<ProductResponse | null> {
  return productPage(slug, { geo: null, radiusKm: null, sort: "price" });
}

export async function getProductOffers(p: {
  slug: string;
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  sort: OfferSort;
}): Promise<ProductResponse | null> {
  return productPage(p.slug, p);
}

export async function getStore(p: { slug: string; page: number }): Promise<StoreResponse | null> {
  const store = MOCK_STORES.find((candidate) => candidate.summary.slug === p.slug);
  if (store === undefined) return null;

  const products: StoreProduct[] = MOCK_PRODUCTS.flatMap((item) => {
    const offer = item.offers.find((candidate) => candidate.store_slug === p.slug);
    if (offer === undefined) return [];
    return [
      {
        ...item.product,
        price_usd: offer.price_usd,
        price_ves: offer.price_ves,
        availability: offer.availability,
        updated_at: offer.updated_at,
      },
    ];
  });

  return {
    data: { ...store.summary, ...MOCK_STORE_DETAILS[p.slug] },
    products: pageOf(products, p.page, STORE_PRODUCTS_PER_PAGE),
    meta: { page: p.page, per_page: STORE_PRODUCTS_PER_PAGE, total: products.length },
    rate: MOCK_RATE,
  };
}

export async function listSitemap(p: { type: SitemapType; page: number }): Promise<SitemapResponse> {
  const slugs =
    p.type === "products"
      ? MOCK_PRODUCTS.map((item) => item.product.slug)
      : MOCK_STORES.map((store) => store.summary.slug);

  return {
    data: pageOf(slugs, p.page, SITEMAP_PER_PAGE).map((slug) => ({
      slug,
      updated_at: SITEMAP_UPDATED_AT,
    })),
    meta: { page: p.page, per_page: SITEMAP_PER_PAGE, total: slugs.length },
  };
}

export const sendEvent: (event: MarketplaceEvent) => Promise<void> = async () => {};
