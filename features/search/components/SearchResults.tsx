import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toggleVariants } from "@/components/ui/toggle";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { getEffectiveLocation } from "@/features/location/server/location";
import { formatRate } from "@/lib/format";
import { listCategories, searchProducts } from "@/lib/marketplace/client";
import { cn } from "@/lib/utils";
import { ViewBeacon } from "@/features/events/components/ViewBeacon";
import { ActiveFilters } from "./ActiveFilters";
import { EmptyState } from "./EmptyState";
import { FeaturedCard } from "./FeaturedCard";
import { FiltersSheet } from "./FiltersSheet";
import { OpenNowFilter } from "./OpenNowFilter";
import { Pagination } from "./Pagination";
import { NearbyProducts, NearbyProductsSkeleton } from "./NearbyProducts";
import { ProductCard } from "./ProductCard";
import { parseSearchQuery, searchHref } from "../lib/query";
import { RadiusFilter } from "./RadiusFilter";
import { ResultsHeader } from "./ResultsHeader";
import { SortLinks } from "./SortLinks";

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
      openNow: query.openNow === true ? true : undefined,
      sort: geoKind === null && query.sort === "distance" ? undefined : query.sort,
    }),
    listCategories(),
  ]);
  const isEmpty = data.length === 0 && featured.length === 0;

  const gridClasses = "grid grid-cols-2 gap-4 lg:grid-cols-3";

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-8">
      {query.pagina === 1 && (
        <ViewBeacon
          event={{
            type: "search",
            store_slug: null,
            product_slug: null,
            query: query.q === "" ? null : query.q,
            category_slug: query.categoria,
            results_count: meta.total,
          }}
        />
      )}
      {/* SIDEBAR PARA DESKTOP */}
      <aside className="hidden md:flex w-64 flex-col gap-8 shrink-0 sticky top-24">
        <div className="flex flex-col gap-4">
          <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Categorías</h3>
          <ul className="flex flex-col gap-1">
            {categories.map((category) => {
              const active = category.slug === query.categoria;
              return (
                <li key={category.slug}>
                  <Link
                    href={searchHref({ ...query, categoria: active ? null : category.slug, pagina: 1 })}
                    className={cn(
                      "block px-3 py-2 text-sm rounded-lg transition-colors",
                      active 
                        ? "bg-primary-soft text-primary-text font-bold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {category.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        {geoKind !== null && (
          <div className="flex flex-col gap-4">
            <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Distancia máxima</h3>
            <RadiusFilter query={query} geoKind={geoKind} cityName={geoKind === "city" ? locationName : null} />
          </div>
        )}
        <div className="flex flex-col gap-4">
          <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Disponibilidad</h3>
          <OpenNowFilter query={query} />
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL Y FILTROS MOBILE */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <div className="md:hidden flex flex-col gap-3">
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
          <FiltersSheet key={searchHref(query)}>
            {geoKind !== null && (
              <div className="flex flex-col gap-3">
                <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Distancia</h3>
                <RadiusFilter query={query} geoKind={geoKind} cityName={geoKind === "city" ? locationName : null} />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Disponibilidad</h3>
              <OpenNowFilter query={query} />
            </div>
          </FiltersSheet>
        </div>
      <ResultsHeader
        query={query}
        categories={categories}
        total={meta.total}
        geoKind={geoKind}
        locationName={locationName}
        showTotal={!isEmpty}
      />
      <ActiveFilters query={query} categories={categories} hasLocation={geoKind !== null} />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {!isEmpty && <SortLinks query={query} hasLocation={geoKind !== null} />}
        <p className="ml-auto text-sm text-muted-foreground">{formatRate(rate)}</p>
      </div>
      {isEmpty ? (
        <EmptyState
          query={query}
          geoKind={geoKind}
          categories={categories}
          nearby={
            <Suspense fallback={<NearbyProductsSkeleton />}>
              <NearbyProducts
                title={query.openNow === true ? "Quizás te sirve (sin filtrar por horario)" : "Quizás te sirve"}
                showAll={false}
              />
            </Suspense>
          }
        />
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
          <Pagination meta={meta} hrefForPage={(pagina) => searchHref({ ...query, pagina })} />
        </>
      )}
    </div>
  </div>
  );
}
