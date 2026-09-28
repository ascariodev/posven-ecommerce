import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { postJson, requestJson, requestJsonOrNull } from "./http";
import * as mock from "./mock/adapter";
import {
  pageQuery,
  productQuery,
  searchQuery,
  storesQuery,
  type GeoFilter,
  type OfferSort,
  type RadiusKm,
} from "./params";
import {
  categoriesResponseSchema,
  locationsResponseSchema,
  productResponseSchema,
  searchResponseSchema,
  sitemapResponseSchema,
  storeResponseSchema,
  storesResponseSchema,
  type CategoryNode,
  type LocationState,
  type MarketplaceEvent,
  type ProductResponse,
  type SearchResponse,
  type SitemapResponse,
  type SitemapType,
  type StoreResponse,
  type StoresResponse,
} from "./schemas";

function usesMock(): boolean {
  const mode = process.env.MARKETPLACE_MODE;
  if (mode === undefined || mode === "mock") return true;
  if (mode === "api") return false;
  throw new Error("MARKETPLACE_MODE debe ser mock o api");
}

export async function searchProducts(p: {
  q: string;
  category: string | null;
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
}): Promise<SearchResponse> {
  if (usesMock()) return mock.searchProducts(p);
  return requestJson("/search", searchQuery(p), searchResponseSchema);
}

export async function listNearbyStores(p: {
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
}): Promise<StoresResponse> {
  if (usesMock()) return mock.listNearbyStores(p);
  return requestJson("/stores", storesQuery(p), storesResponseSchema);
}

export async function listCategories(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("marketplace:categories");
  if (usesMock()) return mock.listCategories();
  const response = await requestJson("/categories", new URLSearchParams(), categoriesResponseSchema);
  return response.data;
}

export async function listLocations(): Promise<LocationState[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("marketplace:locations");
  if (usesMock()) return mock.listLocations();
  const response = await requestJson("/locations", new URLSearchParams(), locationsResponseSchema);
  return response.data;
}

export async function getProduct(slug: string): Promise<ProductResponse | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`marketplace:product:${slug}`);
  if (usesMock()) return mock.getProduct(slug);
  return requestJsonOrNull(
    `/products/${encodeURIComponent(slug)}`,
    productQuery({ geo: null, radiusKm: null, sort: "price" }),
    productResponseSchema,
  );
}

export async function getProductOffers(p: {
  slug: string;
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  sort: OfferSort;
}): Promise<ProductResponse | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`marketplace:product:${p.slug}`);
  if (usesMock()) return mock.getProductOffers(p);
  return requestJsonOrNull(
    `/products/${encodeURIComponent(p.slug)}`,
    productQuery(p),
    productResponseSchema,
  );
}

export async function getStore(p: { slug: string; page: number }): Promise<StoreResponse | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`marketplace:store:${p.slug}`);
  if (usesMock()) return mock.getStore(p);
  return requestJsonOrNull(
    `/stores/${encodeURIComponent(p.slug)}`,
    pageQuery(p.page),
    storeResponseSchema,
  );
}

export async function listSitemap(p: { type: SitemapType; page: number }): Promise<SitemapResponse> {
  "use cache";
  cacheLife("hours");
  cacheTag(`marketplace:sitemap:${p.type}`);
  if (usesMock()) return mock.listSitemap(p);
  return requestJson(`/sitemap/${p.type}`, pageQuery(p.page), sitemapResponseSchema);
}

export async function sendEvent(event: MarketplaceEvent): Promise<void> {
  if (usesMock()) return mock.sendEvent(event);
  await postJson("/events", event);
}
