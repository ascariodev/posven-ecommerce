import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { requestJson } from "./http";
import * as mock from "./mock/adapter";
import { searchQuery, storesQuery, type GeoFilter, type RadiusKm } from "./params";
import {
  categoriesResponseSchema,
  locationsResponseSchema,
  searchResponseSchema,
  storesResponseSchema,
  type CategoryNode,
  type LocationState,
  type SearchResponse,
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
