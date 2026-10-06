import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { toGeoFilter } from "@/features/location/lib/cookie";
import { getEffectiveLocation } from "@/features/location/server/location";
import { formatDistance, formatUsd, formatVes } from "@/lib/format";
import { listNearbyProducts } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";
import type { NearbyProductsResponse, SearchItem } from "@/lib/marketplace/schemas";
import { SITE_NAME } from "@/lib/site";
import { searchHref } from "../lib/query";
import { ProductThumb } from "./ProductThumb";

const MAX_PRODUCTS = 8;

function storesLabel(count: number): string {
  return count === 1 ? "1 tienda" : `${count} tiendas`;
}

function NearbyProductCard({ item }: { item: SearchItem }) {
  return (
    <Link
      href={`/p/${item.slug}`}
      className="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-2.5 pb-3 shadow-card transition-shadow duration-200 ease-out hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
    >
      <ProductThumb imageUrl={item.image_url} category={item.category} size="card" className="aspect-square" />
      <span className="flex min-w-0 flex-col gap-0.5 px-1">
        <span className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">{item.name}</span>
        <span className="order-first text-xs text-muted-foreground">
          {storesLabel(item.offers_count)}
          {item.nearest_km !== null && ` · ${formatDistance(item.nearest_km)}`}
        </span>
        {item.outside_radius && <span className="text-xs text-muted-foreground">Fuera de tu zona</span>}
        <span className="mt-0.5 font-heading text-xl font-bold text-primary-text tabular-nums">
          {item.offers_count > 1 && <span className="font-sans text-xs font-medium text-muted-foreground">desde </span>}
          {formatUsd(item.min_price_usd)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">{formatVes(item.min_price_ves)}</span>
      </span>
      <span
        aria-hidden="true"
        className="mt-auto rounded-lg bg-ink py-2.5 text-center text-sm font-semibold text-ink-foreground transition-opacity group-hover:opacity-90 motion-reduce:transition-none"
      >
        Ver ofertas
      </span>
    </Link>
  );
}

export async function NearbyProducts({
  title,
  showAll = true,
  headingId = "nearby-products-title",
  openNow = false,
}: { title?: string; showAll?: boolean; headingId?: string; openNow?: boolean } = {}) {
  const { location } = await getEffectiveLocation();
  const geo = toGeoFilter(location);
  let response: NearbyProductsResponse;
  try {
    response = await listNearbyProducts({ geo, radiusKm: geo ? DEFAULT_RADIUS_KM : null, page: 1, openNow: openNow || undefined });
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) return null;
    throw error;
  }
  const items = response.data.slice(0, MAX_PRODUCTS);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="font-heading text-xl font-semibold tracking-tight text-foreground">
          {title ?? (location !== null ? "Cerca de ti" : `Productos en ${SITE_NAME}`)}
        </h2>
        {showAll && (
          <Link
            href={searchHref({ q: "", categoria: null, radio: DEFAULT_RADIUS_KM, pagina: 1 })}
            className="inline-flex h-11 items-center rounded-lg px-2 text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Ver todo
          </Link>
        )}
      </div>
      <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={item.slug} className="w-44 shrink-0 snap-start sm:w-52">
            <NearbyProductCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NearbyProductsSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-80 w-44 shrink-0 rounded-2xl sm:w-52" />
      ))}
    </div>
  );
}
