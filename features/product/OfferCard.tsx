import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ContactButtons } from "@/features/events/ContactButtons";
import { formatDistance, formatUpdatedAgo, formatUsd, formatVes } from "@/lib/format";
import type { ProductOffer, Restriction } from "@/lib/marketplace/schemas";

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
  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={`/tienda/${store.slug}`}
            className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {store.name}
          </Link>
          <p className="text-sm text-muted-foreground">
            {store.city.name}
            {offer.distance_km !== null && ` · ${formatDistance(offer.distance_km)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {featured && <Badge variant="featured">Destacado</Badge>}
          {offer.availability === "low" && <Badge variant="warning">Pocas unidades</Badge>}
        </div>
      </div>
      <div>
        <p className="font-semibold text-foreground">{formatUsd(offer.price_usd)}</p>
        <p className="text-sm text-foreground">{formatVes(offer.price_ves)}</p>
        <p className="text-sm text-muted-foreground">{formatUpdatedAgo(offer.updated_at, now)}</p>
      </div>
      <ContactButtons store={store} product={product} />
    </Card>
  );
}
