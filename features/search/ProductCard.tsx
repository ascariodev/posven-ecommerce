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
      className="flex h-full gap-4 rounded-lg border border-border bg-surface p-4 shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-raised motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <ProductThumb imageUrl={item.image_url} category={item.category} size="md" />
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="font-medium text-foreground">{item.name}</h3>
        {item.brand !== null && <p className="text-sm text-muted-foreground">{item.brand}</p>}
        <div className="flex flex-wrap gap-1">
          {item.restriction === "recipe" && <Badge variant="warning">Requiere récipe</Badge>}
          {item.outside_radius && <Badge variant="secondary">Fuera de tu zona</Badge>}
        </div>
        <p className="text-xl font-bold text-foreground">
          {pricePrefix}
          {formatUsd(item.min_price_usd)}
        </p>
        <p className="text-sm text-foreground">
          {pricePrefix}
          {formatVes(item.min_price_ves)}
        </p>
        <p className="text-sm text-muted-foreground">
          {storesLabel(item.offers_count)}
          {item.nearest_km !== null && ` · ${formatDistance(item.nearest_km)}`}
        </p>
      </div>
    </Link>
  );
}
