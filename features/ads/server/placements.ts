import "server-only";
import { cache } from "react";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { getEffectiveLocation } from "@/features/location/server/location";
import { getPlacements } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { PlacementPage, PlacementsResponse, Piece } from "@/lib/marketplace/schemas";

const loadPlacements = cache(
  async (page: PlacementPage, category: string | null, store: string | null): Promise<PlacementsResponse | null> => {
    const { location } = await getEffectiveLocation();
    const geo = toGeoFilter(location);
    try {
      return await getPlacements({ page, geo, radiusKm: geo ? DEFAULT_RADIUS_KM : null, category, store });
    } catch (error) {
      if (error instanceof MarketplaceUnavailableError) return null;
      throw error;
    }
  },
);

export function getPagePlacements(
  page: PlacementPage,
  scope: { category?: string | null; store?: string | null } = {},
): Promise<PlacementsResponse | null> {
  return loadPlacements(page, scope.category ?? null, scope.store ?? null);
}

export function pieceForSlot(placements: PlacementsResponse | null, slot: string): Piece | null {
  return placements?.slots[slot] ?? null;
}
