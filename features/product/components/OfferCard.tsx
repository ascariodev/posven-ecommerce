import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { cartEnabled } from "@/features/cart/lib/flag";
import { ContactButtons } from "@/features/events/components/ContactButtons";
import { formatDistance, formatUpdatedAgo, formatUsd, formatVes } from "@/lib/format";
import type { ProductOffer, Restriction } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";

export function OfferCard({
  offer,
  product,
  featured,
  now,
}: {
  offer: ProductOffer;
  product: { slug: string; name: string; restriction: Restriction };
  featured: boolean;
  now: Date;
}) {
  const { store } = offer;
  const best = offer.is_best_price === true;
  return (
    <Card className={cn("overflow-hidden", best && "border-success ring-1 ring-success")}>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Link
              href={`/tienda/${store.slug}`}
              className="font-heading text-lg font-bold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {store.name}
            </Link>
            <p className="text-sm font-medium text-muted-foreground">
              {store.city.name}
              {offer.distance_km !== null && ` · ${formatDistance(offer.distance_km)}`}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {best && <Badge variant="success">Mejor precio</Badge>}
              {featured && <Badge variant="default" className="bg-primary-soft text-primary-text">Destacado</Badge>}
              {offer.is_open === true && (
                <Badge variant="success">
                  {offer.closes_at ? `Abierto · cierra ${offer.closes_at}` : "Abierto"}
                </Badge>
              )}
              {offer.is_open === false && <Badge variant="secondary">Cerrado</Badge>}
              {offer.availability === "low" && <Badge variant="warning">Pocas unidades</Badge>}
            </div>
          </div>
          <div className="flex flex-col sm:items-end">
            <p className="font-heading text-2xl font-extrabold tabular-nums text-foreground">{formatUsd(offer.price_usd)}</p>
            <p className="text-sm font-medium tabular-nums text-muted-foreground">{formatVes(offer.price_ves)}</p>
          </div>
        </div>

        <ContactButtons store={store} product={product} />

        <div className="flex flex-col gap-3 border-t border-border pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-muted-foreground">{formatUpdatedAgo(offer.updated_at, now)}</p>
          {cartEnabled() && store.accepts_orders && product.restriction === "none" && (
            <div className="w-full sm:w-auto">
              <AddToCartButton
                storeSlug={store.slug}
                storeName={store.name}
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
