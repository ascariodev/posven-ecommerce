import { getUserLocation } from "@/features/location/server/location";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { parseSearchQuery } from "@/features/search/lib/query";
import { getSuggestions } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { SuggestionsResponse } from "@/lib/marketplace/schemas";

const MIN_QUERY_LENGTH = 2;

type SuggestionsPayload = Omit<SuggestionsResponse, "rate"> & { rate: SuggestionsResponse["rate"] | null };

const EMPTY: SuggestionsPayload = { terms: [], products: [], categories: [], rate: null };

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const { q, radio } = parseSearchQuery({
    q: params.get("q") ?? undefined,
    radio: params.get("radio") ?? undefined,
  });
  if (q.length < MIN_QUERY_LENGTH) return Response.json(EMPTY);

  const geo = toGeoFilter(await getUserLocation());
  try {
    return Response.json(await getSuggestions({ q, geo, radiusKm: radio }));
  } catch (error) {
    if (!(error instanceof MarketplaceUnavailableError)) throw error;
    return Response.json(EMPTY, { status: 503 });
  }
}
