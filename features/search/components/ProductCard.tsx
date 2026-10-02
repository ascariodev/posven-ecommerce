import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatUsd, formatVes } from "@/lib/format";
import type { SearchItem } from "@/lib/marketplace/schemas";
import { ProductThumb } from "./ProductThumb";

function storesLabel(count: number): string {
  return count === 1 ? "En 1 tienda" : `En ${count} tiendas`;
}

export function ProductCard({ item }: { item: SearchItem }) {
  const pricePrefix = item.offers_count > 1 ? "Desde " : "";
  return (
    <Link
      href={`/p/${item.slug}`}
      className="group flex h-full flex-col gap-3 rounded-2xl bg-card p-3 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <ProductThumb
        imageUrl={item.image_url}
        category={item.category}
        size="card"
        className="overflow-hidden rounded-xl bg-muted/30 transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-1 pt-1">
        <h3 className="font-heading line-clamp-2 text-base font-semibold leading-tight text-foreground">{item.name}</h3>
        {item.brand !== null && <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.brand}</p>}
        {(item.restriction === "recipe" || item.outside_radius) && (
          <div className="flex flex-wrap gap-1 py-1">
            {item.restriction === "recipe" && <Badge variant="warning" className="text-[10px]">Requiere récipe</Badge>}
            {item.outside_radius && <Badge variant="secondary" className="text-[10px]">Fuera de tu zona</Badge>}
          </div>
        )}
        <div className="mt-auto pt-2">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-heading text-xl font-bold tracking-tight text-primary">
              {pricePrefix}
              {formatUsd(item.min_price_usd)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {pricePrefix}
              {formatVes(item.min_price_ves)}
            </span>
          </p>
          <p className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {storesLabel(item.offers_count)}
              {item.nearest_km !== null && ` · ${formatDistance(item.nearest_km)}`}
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
