import { Card } from "@/components/ui/card";
import { toGeoFilter } from "@/features/location/cookie";
import { getEffectiveLocation } from "@/features/location/server";
import { formatRate } from "@/lib/format";
import { listCategories, searchProducts } from "@/lib/marketplace/client";
import { EmptyState } from "./EmptyState";
import { FeaturedCard } from "./FeaturedCard";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";
import { parseSearchQuery } from "./query";
import { RadiusFilter } from "./RadiusFilter";

export async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseSearchQuery(await searchParams);
  if (query.q === "" && query.categoria === null) {
    return (
      <Card>
        <p className="text-muted-foreground">Escribe qué buscas o elige una categoría.</p>
      </Card>
    );
  }

  const { location, name: locationName } = await getEffectiveLocation();
  const geoKind = location?.kind ?? null;

  const { data, featured, meta, rate } = await searchProducts({
    q: query.q,
    category: query.categoria,
    geo: toGeoFilter(location),
    radiusKm: query.radio,
    page: query.pagina,
  });
  const isEmpty = data.length === 0 && featured.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">{formatRate(rate)}</p>
      {geoKind !== null && (
        <RadiusFilter query={query} geoKind={geoKind} cityName={geoKind === "city" ? locationName : null} />
      )}
      {isEmpty ? (
        <EmptyState query={query} geoKind={geoKind} categories={await listCategories()} />
      ) : (
        <>
          {featured.length > 0 && (
            <ul aria-label="Destacados" className="grid gap-4 sm:grid-cols-2">
              {featured.map((item) => (
                <li key={`${item.product.slug}:${item.offer.store.slug}`}>
                  <FeaturedCard item={item} />
                </li>
              ))}
            </ul>
          )}
          {data.length > 0 && (
            <ul aria-label="Resultados" className="grid gap-4 sm:grid-cols-2">
              {data.map((item) => (
                <li key={item.slug}>
                  <ProductCard item={item} />
                </li>
              ))}
            </ul>
          )}
          <Pagination query={query} meta={meta} />
        </>
      )}
    </div>
  );
}
