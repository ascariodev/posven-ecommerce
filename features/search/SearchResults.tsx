import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { toggleVariants } from "@/components/ui/toggle";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { getEffectiveLocation } from "@/features/location/server/location";
import { formatRate } from "@/lib/format";
import { listCategories, searchProducts } from "@/lib/marketplace/client";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { FeaturedCard } from "./FeaturedCard";
import { FiltersSheet } from "./FiltersSheet";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";
import { parseSearchQuery, searchHref } from "./query";
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
        <CardContent>
          <p className="text-muted-foreground">Escribe qué buscas o elige una categoría.</p>
        </CardContent>
      </Card>
    );
  }

  const { location, name: locationName } = await getEffectiveLocation();
  const geoKind = location?.kind ?? null;

  const [{ data, featured, meta, rate }, categories] = await Promise.all([
    searchProducts({
      q: query.q,
      category: query.categoria,
      geo: toGeoFilter(location),
      radiusKm: query.radio,
      page: query.pagina,
    }),
    listCategories(),
  ]);
  const isEmpty = data.length === 0 && featured.length === 0;

  const gridClasses = "grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <nav
          aria-label="Categorías"
          className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex gap-2 p-1">
            {categories.map((category) => {
              const active = category.slug === query.categoria;
              return (
                <li key={category.slug} className="shrink-0">
                  <Link
                    href={searchHref({ ...query, categoria: active ? null : category.slug, pagina: 1 })}
                    data-state={active ? "on" : "off"}
                    aria-current={active ? "true" : undefined}
                    className={cn(toggleVariants({ variant: "outline", size: "sm" }), "rounded-full")}
                  >
                    {category.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {geoKind !== null && (
          <div>
            <div className="hidden md:block">
              <RadiusFilter query={query} geoKind={geoKind} cityName={geoKind === "city" ? locationName : null} />
            </div>
            <FiltersSheet key={searchHref(query)}>
              <RadiusFilter query={query} geoKind={geoKind} cityName={geoKind === "city" ? locationName : null} />
            </FiltersSheet>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {!isEmpty && (
          <h2 className="text-lg font-semibold text-foreground">
            {meta.total === 1 ? "1 producto" : `${meta.total} productos`}
          </h2>
        )}
        <p className="ml-auto text-sm text-muted-foreground">{formatRate(rate)}</p>
      </div>
      {isEmpty ? (
        <EmptyState query={query} geoKind={geoKind} categories={categories} />
      ) : (
        <>
          {featured.length > 0 && (
            <ul aria-label="Destacados" className={gridClasses}>
              {featured.map((item) => (
                <li key={`${item.product.slug}:${item.offer.store.slug}`}>
                  <FeaturedCard item={item} />
                </li>
              ))}
            </ul>
          )}
          {data.length > 0 && (
            <ul aria-label="Resultados" className={gridClasses}>
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
