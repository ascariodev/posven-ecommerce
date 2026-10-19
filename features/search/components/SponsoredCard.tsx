import { Badge } from "@/components/ui/badge";
import { AdImpression } from "@/features/ads/components/AdImpression";
import { AdLink } from "@/features/ads/components/AdLink";
import { SPONSORED_LABEL } from "@/features/ads/components/AdBanner";
import { formatDistance, formatUsd, formatVes } from "@/lib/format";
import type { SponsoredProduct } from "@/lib/marketplace/schemas";
import { ProductThumb } from "./ProductThumb";

export function SponsoredCard({ item }: { item: SponsoredProduct }) {
  const { product, offer, token } = item;
  return (
    <AdImpression token={token} className="h-full">
      <AdLink
        piece={{ href: `/p/${product.slug}`, external: false, token }}
        className="group flex h-full flex-col gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <div className="relative">
          <ProductThumb
            imageUrl={product.image_url}
            category={product.category}
            size="card"
            className="transition duration-200 group-hover:shadow-raised motion-reduce:transition-none"
          />
          <Badge variant="default" className="absolute top-2 left-2 bg-primary-soft text-primary-text">
            {SPONSORED_LABEL}
          </Badge>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg bg-primary-soft px-3 py-2">
          <h3 className="line-clamp-2 font-medium text-foreground">{product.name}</h3>
          <p className="text-sm text-foreground">{offer.store.name}</p>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-xl font-bold text-foreground">{formatUsd(offer.price_usd)}</span>
            <span className="text-sm text-foreground">{formatVes(offer.price_ves)}</span>
          </p>
          {offer.distance_km !== null && (
            <p className="text-sm text-foreground">{formatDistance(offer.distance_km)}</p>
          )}
        </div>
      </AdLink>
    </AdImpression>
  );
}
