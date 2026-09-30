import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatUsd, formatVes } from "@/lib/format";
import type { FeaturedProduct } from "@/lib/marketplace/schemas";
import { ProductThumb } from "./ProductThumb";

export function FeaturedCard({ item }: { item: FeaturedProduct }) {
  const { product, offer } = item;
  return (
    <Link
      href={`/p/${product.slug}`}
      className="flex h-full gap-4 rounded-lg border border-border bg-featured p-4 shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-raised motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <ProductThumb imageUrl={product.image_url} category={product.category} size="md" />
      <div className="flex min-w-0 flex-col gap-1">
        <Badge variant="default" className="self-start">
          Destacado
        </Badge>
        <h3 className="font-medium text-foreground">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{offer.store.name}</p>
        <p className="text-xl font-bold text-foreground">{formatUsd(offer.price_usd)}</p>
        <p className="text-sm text-foreground">{formatVes(offer.price_ves)}</p>
        {offer.distance_km !== null && (
          <p className="text-sm text-muted-foreground">{formatDistance(offer.distance_km)}</p>
        )}
      </div>
    </Link>
  );
}
