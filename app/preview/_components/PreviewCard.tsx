import Link from "next/link";
import { formatDistance, formatUsd, formatVes } from "@/lib/format";
import type { SearchItem } from "@/lib/marketplace/schemas";
import { PreviewThumb } from "./PreviewThumb";

export function PreviewCard({ item }: { item: SearchItem }) {
  const prefix = item.offers_count > 1 ? "Desde " : "";
  const stores = item.offers_count === 1 ? "En 1 tienda" : `En ${item.offers_count} tiendas`;
  return (
    <Link
      href={`/p/${item.slug}`}
      className="group flex flex-col gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <PreviewThumb
        imageUrl={item.image_url}
        category={item.category}
        className="aspect-[4/3] transition duration-200 group-hover:shadow-raised motion-reduce:transition-none"
      />
      <div className="flex flex-col gap-0.5 px-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{item.name}</h3>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold text-foreground">
            {prefix}
            {formatUsd(item.min_price_usd)}
          </span>
          <span className="text-sm text-muted-foreground">{formatVes(item.min_price_ves)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {stores}
          {item.nearest_km !== null && ` · ${formatDistance(item.nearest_km)}`}
        </p>
      </div>
    </Link>
  );
}
