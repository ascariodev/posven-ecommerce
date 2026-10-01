import { Skeleton } from "@/components/ui/skeleton";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { getEffectiveLocation } from "@/features/location/server/location";
import { listNearbyStores } from "@/lib/marketplace/client";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import { SITE_NAME } from "@/lib/site";
import { StoreCard } from "./StoreCard";

const MAX_FEATURED_STORES = 2;

export async function NearbyStores() {
  const { location } = await getEffectiveLocation();
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
      <h2 id="nearby-stores-title" className="text-xl font-bold tracking-tight text-foreground">
        {location !== null ? "Tiendas cercanas" : `Tiendas en ${SITE_NAME}`}
      </h2>
      {stores.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay tiendas cerca. Prueba con otra ciudad.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-40" />
      ))}
    </div>
  );
}
