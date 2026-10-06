import { MapPinOff } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { getEffectiveLocation } from "@/features/location/server/location";
import { listNearbyStores } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { StoresResponse } from "@/lib/marketplace/schemas";
import { SITE_NAME } from "@/lib/site";
import { SponsoredStore } from "./SponsoredStore";
import { StoreCard } from "./StoreCard";

const MAX_STORES = 6;

export async function NearbyStores() {
  const { location } = await getEffectiveLocation();
  const geo = toGeoFilter(location);
  let response: StoresResponse;
  try {
    response = await listNearbyStores({ geo, radiusKm: geo ? DEFAULT_RADIUS_KM : null, page: 1 });
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) return null;
    throw error;
  }

  const [sponsored, ...otherFeatured] = response.featured;
  const taken = new Set(response.featured.map((store) => store.slug));
  const stores = [
    ...otherFeatured.map((store) => ({ store, featured: true })),
    ...response.data.filter((store) => !taken.has(store.slug)).map((store) => ({ store, featured: false })),
  ].slice(0, MAX_STORES);

  return (
    <>
      {sponsored !== undefined && <SponsoredStore store={sponsored} />}
      <section aria-labelledby="nearby-stores-title" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="nearby-stores-title" className="font-heading text-xl font-semibold tracking-tight text-foreground">
            {location !== null ? "Comercios cerca" : `Comercios en ${SITE_NAME}`}
          </h2>
          <Link
            href="/tiendas"
            className="inline-flex h-11 items-center rounded-lg px-2 text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Ver todos
          </Link>
        </div>
        {stores.length === 0 ? (
          <EmptyState icon={MapPinOff} title="Todavía no hay comercios cerca." headingLevel="h3" compact description="Prueba con otra ciudad." />
        ) : (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map(({ store, featured }) => (
              <li key={store.slug}>
                <StoreCard store={store} featured={featured} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export function NearbyStoresSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
