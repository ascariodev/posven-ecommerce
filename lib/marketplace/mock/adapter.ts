import {
  nearbyProductsQuery,
  productQuery,
  searchQuery,
  storesQuery,
  suggestionsQuery,
  type AccountContext,
  type GeoFilter,
  type OfferSort,
  type RadiusKm,
} from "../params";
import type {
  CategoryNode,
  FeaturedProduct,
  LocationState,
  MarketplaceEvent,
  NearbyProductsResponse,
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
  SuggestionsResponse,
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
import { accountError, customerIdFor, deleteAccount as deleteMockAccount } from "./accounts";
import { clearMockCart } from "./cart";
import { hasOpenOrders } from "./checkout";
import { mockNow, openStatus, type OpenStatus } from "./schedule";

const SEARCH_PER_PAGE = 20;
const STORES_PER_PAGE = 12;
const SUGGESTION_MIN_LENGTH = 2;
const MAX_SUGGESTED_TERMS = 5;
const MAX_SUGGESTED_PRODUCTS = 4;
const MAX_SUGGESTED_CATEGORIES = 2;
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

const CITIES_WITH_NO_STORES = new Set(
  MOCK_LOCATIONS.flatMap((state) => state.municipalities.flatMap((municipality) => municipality.cities))
    .map((city) => city.slug)
    .filter((slug) => !MOCK_STORES.some((store) => store.summary.city.slug === slug)),
);

function isOutOfRange(scope: Scope): boolean {
  return scope.kind === "city" && CITIES_WITH_NO_STORES.has(scope.city);
}

function storeInScope(store: MockStore, scope: Scope): boolean {
  if (isOutOfRange(scope)) return true;
  if (scope.kind === "city") return store.summary.city.slug === scope.city;
  if (scope.kind === "coords" && scope.radiusKm !== null) return store.distance_km <= scope.radiusKm;
  return true;
}

function productInScope(item: MockProduct, scope: Scope): boolean {
  if (isOutOfRange(scope)) return true;
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
    outside_radius: isOutOfRange(scope),
  };
}

function storeStatus(store: MockStore): OpenStatus {
  return openStatus(MOCK_STORE_DETAILS[store.summary.slug]?.schedule ?? [], mockNow());
}

function withOpenOffers(item: MockProduct): MockProduct | null {
  const offers = item.offers.filter((offer) => storeStatus(findStore(offer.store_slug)).is_open);
  if (offers.length === 0) return null;
  const cheapest = offers.reduce((low, offer) =>
    Number(offer.price_usd) < Number(low.price_usd) ? offer : low,
  );
  return {
    ...item,
    offers,
    min_price_usd: cheapest.price_usd,
    min_price_ves: cheapest.price_ves,
    nearest_km: Math.min(...offers.map((offer) => findStore(offer.store_slug).distance_km)),
  };
}

function orderMatches(matches: MockProduct[], sort: OfferSort | undefined, scope: Scope): MockProduct[] {
  if (sort === undefined) return matches;
  const byDistance = sort === "distance" && scope.kind !== "none";
  return [...matches].sort((a, b) =>
    byDistance
      ? compareNumbers(a.nearest_km, b.nearest_km) ||
        compareNumbers(Number(a.min_price_usd), Number(b.min_price_usd))
      : compareNumbers(Number(a.min_price_usd), Number(b.min_price_usd)) ||
        compareNumbers(a.nearest_km, b.nearest_km),
  );
}

function toOffer(offer: MockOffer, store: MockStore, scope: Scope): Offer {
  return {
    ...storeStatus(store),
    store: store.summary,
    price_usd: offer.price_usd,
    price_ves: offer.price_ves,
    availability: offer.availability,
    updated_at: offer.updated_at,
    distance_km: scope.kind === "none" ? null : store.distance_km,
  };
}

function toFeatured(item: MockProduct, scope: Scope): FeaturedProduct | null {
  if (isOutOfRange(scope)) return null;
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
  sort?: OfferSort;
  openNow?: boolean;
}): Promise<SearchResponse> {
  const query = searchQuery(p);
  const scope = readScope(query);
  const term = normalize(query.get("q") ?? "");
  const textMatches = MOCK_PRODUCTS.filter(
    (item) =>
      matchesText(item, term) &&
      matchesCategory(item, query.get("category")) &&
      productInScope(item, scope),
  );
  const visible =
    query.get("open_now") === "true"
      ? textMatches.flatMap((item) => withOpenOffers(item) ?? [])
      : textMatches;
  const matches = orderMatches(visible, p.sort, scope);

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
    meta: { page: p.page, per_page: SEARCH_PER_PAGE, total: matches.length, out_of_range: isOutOfRange(scope) },
    rate: MOCK_RATE,
  };
}

export async function getSuggestions(p: {
  q: string;
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
}): Promise<SuggestionsResponse> {
  const query = suggestionsQuery(p);
  const scope = readScope(query);
  const term = normalize(query.get("q") ?? "").trim();
  const matches =
    term.length < SUGGESTION_MIN_LENGTH
      ? []
      : MOCK_PRODUCTS.filter((item) => matchesText(item, term) && productInScope(item, scope));

  const terms = [...new Set(matches.map((item) => item.product.name))].slice(0, MAX_SUGGESTED_TERMS);
  const counts = new Map<string, { name: string; count: number }>();
  for (const { product } of matches) {
    if (product.category === null) continue;
    const entry = counts.get(product.category.slug) ?? { name: product.category.name, count: 0 };
    counts.set(product.category.slug, { name: entry.name, count: entry.count + 1 });
  }
  const categories = [...counts.entries()]
    .sort(([, a], [, b]) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, MAX_SUGGESTED_CATEGORIES)
    .map(([slug, { name }]) => ({ slug, name }));

  return {
    terms,
    products: matches.slice(0, MAX_SUGGESTED_PRODUCTS).map((item) => toSearchItem(item, scope)),
    categories,
    rate: MOCK_RATE,
  };
}

export async function listNearbyProducts(p: {
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
  openNow?: boolean;
}): Promise<NearbyProductsResponse> {
  const query = nearbyProductsQuery(p);
  const scope = readScope(query);
  const scoped = MOCK_PRODUCTS.filter((item) => productInScope(item, scope));
  const inScope =
    query.get("open_now") === "true" ? scoped.flatMap((item) => withOpenOffers(item) ?? []) : scoped;
  const ordered = [...inScope].sort((a, b) =>
    scope.kind === "none"
      ? compareNumbers(Number(a.min_price_usd), Number(b.min_price_usd))
      : compareNumbers(a.nearest_km, b.nearest_km) || a.product.name.localeCompare(b.product.name),
  );
  return {
    data: pageOf(ordered, p.page, SEARCH_PER_PAGE).map((item) => toSearchItem(item, scope)),
    meta: { page: p.page, per_page: SEARCH_PER_PAGE, total: ordered.length, out_of_range: isOutOfRange(scope) },
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
    outside_radius: isOutOfRange(scope),
    cover_url: MOCK_STORE_DETAILS[store.summary.slug]?.cover_url ?? null,
    ...storeStatus(store),
  }));

  return {
    data: pageOf(stores, p.page, STORES_PER_PAGE),
    featured:
      p.page === 1 && !isOutOfRange(scope)
        ? stores.filter((store) => store.is_premium).slice(0, MAX_FEATURED)
        : [],
    meta: { page: p.page, per_page: STORES_PER_PAGE, total: stores.length, out_of_range: isOutOfRange(scope) },
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

  const query = productQuery(p);
  const scope = readScope(query);
  const meta = { out_of_range: isOutOfRange(scope) };

  const unavailable = MOCK_UNAVAILABLE_PRODUCTS.find((product) => product.slug === slug);
  if (unavailable !== undefined) {
    return {
      data: { ...unavailable, offers_summary: summarize([]) },
      featured: [],
      offers: [],
      rate: MOCK_RATE,
      meta,
    };
  }

  const item = MOCK_PRODUCTS.find((candidate) => candidate.product.slug === slug);
  if (item === undefined) return null;

  const byDistance = query.get("sort") === "distance" && scope.kind !== "none";
  const ordered = item.offers
    .map((offer) => ({ offer, store: findStore(offer.store_slug) }))
    .sort((a, b) =>
      byDistance
        ? compareDistance(a, b) || comparePrice(a, b)
        : comparePrice(a, b) || compareDistance(a, b),
    );

  const inScope = meta.out_of_range ? [] : ordered.filter((entry) => storeInScope(entry.store, scope));
  const featured = inScope.filter((entry) => entry.store.summary.is_premium).slice(0, MAX_FEATURED);
  const rest = inScope.filter((entry) => !featured.includes(entry));
  const bounded = scope.kind === "city" || (scope.kind === "coords" && scope.radiusKm !== null);
  const outside = meta.out_of_range
    ? ordered
    : bounded && inScope.length < MIN_OFFERS_IN_SCOPE
      ? ordered
          .filter((entry) => !inScope.includes(entry))
          .sort(compareDistance)
          .slice(0, MIN_OFFERS_IN_SCOPE - inScope.length)
      : [];

  const served = [
    ...rest.map((entry) => ({ entry, outsideRadius: false })),
    ...outside.map((entry) => ({ entry, outsideRadius: true })),
  ].slice(0, MAX_OFFERS);
  const bestPrice = Math.min(
    ...[...featured, ...served.filter((item) => !item.outsideRadius).map((item) => item.entry)].map((entry) =>
      Number(entry.offer.price_usd),
    ),
  );
  const toProductOffer = (entry: StoreOffer, outsideRadius: boolean): ProductOffer => ({
    ...toOffer(entry.offer, entry.store, scope),
    outside_radius: outsideRadius,
    is_best_price: !outsideRadius && Number(entry.offer.price_usd) === bestPrice,
  });

  return {
    data: { ...item.product, offers_summary: summarize(item.offers) },
    featured: featured.map((entry) => toProductOffer(entry, false)),
    offers: served.map((item) => toProductOffer(item.entry, item.outsideRadius)),
    rate: MOCK_RATE,
    meta,
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
    data: { ...store.summary, ...MOCK_STORE_DETAILS[p.slug], ...storeStatus(store) },
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

export const sendEvent: (event: MarketplaceEvent, clientIp: string | null) => Promise<void> = async () => {};

export {
  addFavorite,
  changePassword,
  createAddress,
  deleteAddress,
  getMe,
  listAddresses,
  listFavorites,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  removeFavorite,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  updateAddress,
  updateMe,
  updateSettings,
  verifyEmail,
} from "./accounts";

export { getCart, mergeCart, quoteGuestCart, setCartItem } from "./cart";

// Checkout y compras (plan 4b): eliminar la cuenta se bloquea con pedidos abiertos y borra el
// carrito; las compras se conservan (spec §5.8).
export async function deleteAccount(ctx: AccountContext, input: { password: string }): Promise<void> {
  const id = customerIdFor(ctx);
  await deleteMockAccount(ctx, input, (customerId) => {
    if (hasOpenOrders(customerId)) throw accountError("open_orders");
  });
  clearMockCart(id);
}

export { getBuyAgain, getPurchase, listPurchases, quoteCheckout, startCheckout } from "./checkout";
