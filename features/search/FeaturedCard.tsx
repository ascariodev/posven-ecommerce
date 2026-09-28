import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatUsd, formatVes } from "@/lib/format";
import type { FeaturedProduct } from "@/lib/marketplace/schemas";

export function FeaturedCard({ item }: { item: FeaturedProduct }) {
  const { product, offer } = item;
  return (
    <Link
      href={`/p/${product.slug}`}
      className="flex h-full flex-col gap-1 rounded-lg border border-border bg-featured p-4 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <Badge variant="featured" className="self-start">
        Destacado
      </Badge>
      <h3 className="font-medium text-foreground">{product.name}</h3>
      <p className="text-sm text-muted-foreground">{offer.store.name}</p>
      <p className="font-semibold text-foreground">{formatUsd(offer.price_usd)}</p>
      <p className="text-sm text-foreground">{formatVes(offer.price_ves)}</p>
      {offer.distance_km !== null && (
        <p className="text-sm text-muted-foreground">{formatDistance(offer.distance_km)}</p>
      )}
    </Link>
  );
}
