import { clientIpFrom } from "@/features/account/server/session";
import { getUserLocation } from "@/features/location/server/location";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { parseSearchQuery } from "@/features/search/lib/query";
import { getSuggestions } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { SuggestionsResponse } from "@/lib/marketplace/schemas";
import { createRateLimiter, rateLimitedResponse, SUGGESTIONS_PER_MINUTE } from "@/lib/rate-limit";

const MIN_QUERY_LENGTH = 2;

const checkRate = createRateLimiter(SUGGESTIONS_PER_MINUTE);

type SuggestionsPayload = Omit<SuggestionsResponse, "rate"> & { rate: SuggestionsResponse["rate"] | null };

const EMPTY: SuggestionsPayload = { terms: [], products: [], categories: [], rate: null };

export async function GET(request: Request): Promise<Response> {
  const clientIp = clientIpFrom(request.headers.get("x-forwarded-for"));
  if (clientIp !== null) {
    const rate = checkRate(clientIp, Date.now());
    if (!rate.allowed) return rateLimitedResponse(rate.retryAfterSeconds);
  }

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
