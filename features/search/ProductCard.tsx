import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatUsd, formatVes } from "@/lib/format";
import type { SearchItem } from "@/lib/marketplace/schemas";

function storesLabel(count: number): string {
  return count === 1 ? "En 1 tienda" : `En ${count} tiendas`;
}

export function ProductCard({ item }: { item: SearchItem }) {
  const pricePrefix = item.offers_count > 1 ? "Desde " : "";
  return (
    <Link
      href={`/p/${item.slug}`}
      className="flex h-full gap-4 rounded-lg border border-border bg-background p-4 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      {item.image_url !== null ? (
        <Image
          src={item.image_url}
          alt=""
          width={96}
          height={96}
          className="size-24 shrink-0 rounded-md object-contain"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-24 shrink-0 items-center justify-center rounded-md bg-muted text-3xl font-semibold text-muted-foreground"
        >
          {item.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="font-medium text-foreground">{item.name}</h3>
        {item.brand !== null && <p className="text-sm text-muted-foreground">{item.brand}</p>}
        <div className="flex flex-wrap gap-1">
          {item.restriction === "recipe" && <Badge variant="warning">Requiere récipe</Badge>}
          {item.outside_radius && <Badge>Fuera de tu zona</Badge>}
        </div>
        <p className="font-semibold text-foreground">
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
