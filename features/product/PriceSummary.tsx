import { formatUsd } from "@/lib/format";
import type { OffersSummary } from "@/lib/marketplace/schemas";

export function PriceSummary({ summary }: { summary: OffersSummary }) {
  const low = summary.low_price_usd;
  if (low === null) return null;
  const high = summary.high_price_usd;
  const stores = summary.offer_count === 1 ? "en 1 tienda" : `en ${summary.offer_count} tiendas`;

  return (
    <div className="flex flex-col gap-1">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm text-muted-foreground">Desde</span>
        <span className="text-3xl font-extrabold text-foreground">{formatUsd(low)}</span>
        {high !== null && high !== low && (
          <span className="text-sm text-muted-foreground">hasta {formatUsd(high)}</span>
        )}
      </p>
      <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
        <span>{stores}</span>
        <span aria-hidden="true">·</span>
        <span>Precio en todo el país</span>
      </p>
    </div>
  );
}
