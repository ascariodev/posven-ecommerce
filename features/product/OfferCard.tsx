import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { cartEnabled } from "@/features/cart/lib/flag";
import { ContactButtons } from "@/features/events/ContactButtons";
import { formatDistance, formatUpdatedAgo, formatUsd, formatVes } from "@/lib/format";
import type { ProductOffer, Restriction } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";

export function OfferCard({
  offer,
  product,
  featured,
  best,
  now,
}: {
  offer: ProductOffer;
  product: { slug: string; name: string; restriction: Restriction };
  featured: boolean;
  best: boolean;
  now: Date;
}) {
  const { store } = offer;
  return (
    <Card className={cn(best && "border-best-foreground ring-1 ring-best-foreground")}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              href={`/tienda/${store.slug}`}
              className="font-semibold text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {store.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {store.city.name}
              {offer.distance_km !== null && ` · ${formatDistance(offer.distance_km)}`}
            </p>
            <div className="flex flex-wrap gap-1">
              {best && <Badge variant="best">Mejor precio</Badge>}
              {featured && <Badge variant="default">Destacado</Badge>}
              {offer.availability === "low" && <Badge variant="warning">Pocas unidades</Badge>}
            </div>
          </div>
          <div className="flex flex-col sm:items-end">
            <p className="text-xl font-bold text-foreground">{formatUsd(offer.price_usd)}</p>
            <p className="text-sm text-foreground">{formatVes(offer.price_ves)}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{formatUpdatedAgo(offer.updated_at, now)}</p>
        {cartEnabled() && store.accepts_orders && product.restriction === "none" && (
          <AddToCartButton
            storeSlug={store.slug}
            storeName={store.name}
            productSlug={product.slug}
            productName={product.name}
          />
        )}
        <ContactButtons store={store} product={product} />
      </CardContent>
    </Card>
  );
}
