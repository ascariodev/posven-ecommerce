import { Skeleton } from "@/components/ui/skeleton";
import { describeLocation, toGeoFilter } from "@/features/location/cookie";
import { getUserLocation } from "@/features/location/server";
import { listLocations, listNearbyStores } from "@/lib/marketplace/client";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import { SITE_NAME } from "@/lib/site";
import { StoreCard } from "./StoreCard";

const MAX_FEATURED_STORES = 2;

export async function NearbyStores() {
  const [storedLocation, states] = await Promise.all([getUserLocation(), listLocations()]);
  const location = describeLocation(storedLocation, states) === null ? null : storedLocation;
  const geo = toGeoFilter(location);
  const { data, featured } = await listNearbyStores({
    geo,
    radiusKm: geo ? DEFAULT_RADIUS_KM : null,
    page: 1,
  });

  const featuredStores = featured.slice(0, MAX_FEATURED_STORES);
  const featuredSlugs = new Set(featuredStores.map((store) => store.slug));
  const stores = [
    ...featuredStores.map((store) => ({ store, featured: true })),
    ...data.filter((store) => !featuredSlugs.has(store.slug)).map((store) => ({ store, featured: false })),
  ];

  return (
    <section aria-labelledby="nearby-stores-title" className="flex flex-col gap-3">
      <h2 id="nearby-stores-title" className="text-lg font-semibold text-foreground">
        {location !== null ? "Tiendas cercanas" : `Tiendas en ${SITE_NAME}`}
      </h2>
      {stores.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay tiendas cerca. Prueba con otra ciudad.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {stores.map(({ store, featured: isFeatured }) => (
            <li key={store.slug}>
              <StoreCard store={store} featured={isFeatured} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function NearbyStoresSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-24" />
      ))}
    </div>
  );
}
