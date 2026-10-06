import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cartEnabled } from "@/features/cart/lib/flag";
import { ContactButtons } from "@/features/events/components/ContactButtons";
import { formatDistance, formatUpdatedAgo, formatUsd, formatVes } from "@/lib/format";
import type { ProductOffer, Restriction } from "@/lib/marketplace/schemas";
import { PremiumSeal } from "@/features/store/components/PremiumSeal";
import { OfferSelectButton } from "./OfferSelection";

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
  const selectable = cartEnabled() && store.accepts_orders && product.restriction !== "recipe";
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 has-[[aria-pressed=true]]:border-foreground has-[[aria-pressed=true]]:ring-1 has-[[aria-pressed=true]]:ring-foreground">
      <div className="flex items-start gap-3">
        {selectable && <OfferSelectButton storeSlug={store.slug} storeName={store.name} priceUsd={offer.price_usd} />}
        <div className="flex min-w-0 flex-1 flex-col">
          <Link
            href={`/tienda/${store.slug}`}
            className="inline-flex min-h-11 items-center font-heading text-base font-bold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {store.name}
          </Link>
          {store.is_premium && <PremiumSeal />}
          <p className="text-sm font-medium text-muted-foreground">
            {store.city.name}
            {offer.distance_km !== null && ` · ${formatDistance(offer.distance_km)}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <p className="font-heading text-xl font-extrabold tabular-nums text-foreground">{formatUsd(offer.price_usd)}</p>
          <p className="text-sm font-medium tabular-nums text-muted-foreground">{formatVes(offer.price_ves)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {best && <Badge variant="success">Mejor precio</Badge>}
        {featured && <Badge variant="default" className="bg-primary-soft text-primary-text">Destacado</Badge>}
        {offer.is_open === true && (
          <Badge variant="success">{offer.closes_at ? `Abierto · cierra ${offer.closes_at}` : "Abierto"}</Badge>
        )}
        {offer.is_open === false && <Badge variant="secondary">Cerrado</Badge>}
        {offer.availability === "low" && <Badge variant="warning">Pocas unidades</Badge>}
      </div>
      <ContactButtons store={store} product={product} />
      <p className="text-xs font-medium text-muted-foreground">{formatUpdatedAgo(offer.updated_at, now)}</p>
    </div>
  );
}
