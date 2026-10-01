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
      className="group flex h-full flex-col gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <ProductThumb
        imageUrl={item.image_url}
        category={item.category}
        size="card"
        className="transition duration-200 group-hover:shadow-raised motion-reduce:transition-none"
      />
      <div className="flex min-w-0 flex-col gap-0.5 px-1">
        <h3 className="line-clamp-2 font-medium text-foreground">{item.name}</h3>
        {item.brand !== null && <p className="text-sm text-muted-foreground">{item.brand}</p>}
        {(item.restriction === "recipe" || item.outside_radius) && (
          <div className="flex flex-wrap gap-1 py-0.5">
            {item.restriction === "recipe" && <Badge variant="warning">Requiere récipe</Badge>}
            {item.outside_radius && <Badge variant="secondary">Fuera de tu zona</Badge>}
          </div>
        )}
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xl font-bold text-foreground">
            {pricePrefix}
            {formatUsd(item.min_price_usd)}
          </span>
          <span className="text-sm text-foreground">
            {pricePrefix}
            {formatVes(item.min_price_ves)}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          {storesLabel(item.offers_count)}
          {item.nearest_km !== null && ` · ${formatDistance(item.nearest_km)}`}
        </p>
      </div>
    </Link>
  );
}
