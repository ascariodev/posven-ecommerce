import { MapPinOff } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/features/search/components/Pagination";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { getEffectiveLocation } from "@/features/location/server/location";
import { listNearbyStores } from "@/lib/marketplace/client";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import { SITE_NAME } from "@/lib/site";
import { SponsoredStore } from "./SponsoredStore";
import { StoreCard } from "./StoreCard";

const POSITIVE_INTEGER = /^\d+$/;

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || !POSITIVE_INTEGER.test(raw)) return 1;
  const page = Number.parseInt(raw, 10);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

function pageHref(page: number): string {
  return page === 1 ? "/tiendas" : `/tiendas?pagina=${page}`;
}

export async function StoresDirectory({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const page = parsePage((await searchParams).pagina);
  const { location } = await getEffectiveLocation();
  const geo = toGeoFilter(location);
  const { data, featured, sponsored, meta } = await listNearbyStores({
    geo,
    radiusKm: geo ? DEFAULT_RADIUS_KM : null,
    page,
    placement: "stores_native",
  });

  const taken = new Set([...featured.map((store) => store.slug), sponsored?.slug]);
  const stores = [
    ...featured.filter((store) => store.slug !== sponsored?.slug).map((store) => ({ store, featured: true })),
    ...data.filter((store) => !taken.has(store.slug)).map((store) => ({ store, featured: false })),
  ];
  const sponsoredAt = Math.min(featured.filter((store) => store.slug !== sponsored?.slug).length, stores.length);

  if (stores.length === 0 && sponsored === undefined) {
    return (
      <>
        {page > 1 && <meta name="robots" content="noindex" />}
        <EmptyState
          icon={MapPinOff}
          title={page > 1 ? "No hay más comercios." : "Todavía no hay comercios cerca."}
          description={page > 1 ? undefined : "Prueba con otra ciudad."}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        {meta.total === 1 ? "1 comercio" : `${meta.total} comercios`}
        {location !== null ? " cerca de ti" : ` en ${SITE_NAME}`}
      </p>
      <ul aria-label="Comercios" className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stores.slice(0, sponsoredAt).map(({ store, featured: isFeatured }) => (
          <li key={store.slug}>
            <StoreCard store={store} featured={isFeatured} />
          </li>
        ))}
        {sponsored !== undefined && (
          <li key={`sponsored-${sponsored.slug}`}>
            <SponsoredStore store={sponsored} />
          </li>
        )}
        {stores.slice(sponsoredAt).map(({ store, featured: isFeatured }) => (
          <li key={store.slug}>
            <StoreCard store={store} featured={isFeatured} />
          </li>
        ))}
      </ul>
      <Pagination meta={meta} hrefForPage={pageHref} />
    </div>
  );
}

export function StoresDirectorySkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}
