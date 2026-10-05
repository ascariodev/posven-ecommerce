import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/features/search/components/Pagination";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { getEffectiveLocation } from "@/features/location/server/location";
import { listNearbyStores } from "@/lib/marketplace/client";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import { SITE_NAME } from "@/lib/site";
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
  const { data, featured, meta } = await listNearbyStores({
    geo,
    radiusKm: geo ? DEFAULT_RADIUS_KM : null,
    page,
  });

  const taken = new Set(featured.map((store) => store.slug));
  const stores = [
    ...featured.map((store) => ({ store, featured: true })),
    ...data.filter((store) => !taken.has(store.slug)).map((store) => ({ store, featured: false })),
  ];

  if (stores.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground">
            {page > 1 ? "No hay más comercios." : "Todavía no hay comercios cerca. Prueba con otra ciudad."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        {meta.total === 1 ? "1 comercio" : `${meta.total} comercios`}
        {location !== null ? " cerca de ti" : ` en ${SITE_NAME}`}
      </p>
      <ul aria-label="Comercios" className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map(({ store, featured: isFeatured }) => (
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
