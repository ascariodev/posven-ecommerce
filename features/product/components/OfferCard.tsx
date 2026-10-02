import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { cartEnabled } from "@/features/cart/lib/flag";
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
    <Card className={cn("overflow-hidden", best && "border-best-foreground ring-1 ring-best-foreground")}>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="font-heading text-lg font-bold text-foreground">
              Comercio Aliado
            </span>
            <p className="text-sm font-medium text-muted-foreground">
              {store.city.name}
              {offer.distance_km !== null && ` · ${formatDistance(offer.distance_km)}`}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {best && <Badge variant="best" className="bg-best/10 text-best">Mejor precio</Badge>}
              {featured && <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">Destacado</Badge>}
              {offer.availability === "low" && <Badge variant="warning" className="bg-warning/10 text-warning">Pocas unidades</Badge>}
            </div>
          </div>
          <div className="flex flex-col sm:items-end">
            <p className="font-heading text-2xl font-extrabold text-foreground">{formatUsd(offer.price_usd)}</p>
            <p className="text-sm font-medium text-muted-foreground">{formatVes(offer.price_ves)}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground">{formatUpdatedAgo(offer.updated_at, now)}</p>
          {cartEnabled() && store.accepts_orders && product.restriction === "none" && (
            <div className="sm:w-auto w-full">
              <AddToCartButton
                storeSlug={store.slug}
                storeName="Comercio Aliado"
                productSlug={product.slug}
                productName={product.name}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
