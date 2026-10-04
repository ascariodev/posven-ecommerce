import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatUsd, formatVes } from "@/lib/format";
import type { SearchItem } from "@/lib/marketplace/schemas";
import { ProductThumb } from "./ProductThumb";

function storesLabel(count: number): string {
  return count === 1 ? "1 tienda" : `${count} tiendas`;
}

export function ProductCard({ item }: { item: SearchItem }) {
  const pricePrefix = item.offers_count > 1 ? "Desde " : "";
  return (
    <Link
      href={`/p/${item.slug}`}
      className="group flex h-full flex-col rounded-2xl bg-card border border-border shadow-card transition-all duration-300 hover:shadow-lg hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary overflow-hidden"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-tile border-b border-border">
        <ProductThumb
          imageUrl={item.image_url}
          category={item.category}
          size="card"
          className="!aspect-auto h-full w-full !rounded-none object-contain transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {(item.restriction === "recipe" || item.outside_radius) && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {item.restriction === "recipe" && <Badge variant="warning" className="text-[10px] px-2 py-0.5 shadow-sm">Récipe</Badge>}
            {item.outside_radius && <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-card shadow-card text-foreground">Fuera zona</Badge>}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pt-3 pb-4">
        {item.brand !== null ? (
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{item.brand}</p>
        ) : (
          <p className="text-[11px] font-bold uppercase tracking-widest text-transparent select-none mb-1.5">-</p>
        )}
        <h3 className="font-heading line-clamp-2 text-sm md:text-base font-bold leading-tight text-foreground mb-4 min-h-[2.5rem] group-hover:text-primary-text transition-colors">{item.name}</h3>
        
        <div className="mt-auto flex flex-col pt-2 border-t border-border">
          <p className="text-[11px] text-primary-text font-bold uppercase tracking-wider mb-0.5">{pricePrefix}</p>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-heading text-2xl font-black tracking-tight text-primary-text leading-none">
              {formatUsd(item.min_price_usd)}
            </span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            {formatVes(item.min_price_ves)}
          </p>
          
          <p className="mt-3 text-[11px] font-medium text-foreground/70 bg-muted px-2 py-1 rounded-md inline-block w-fit">
            Disponible en {storesLabel(item.offers_count)}
            {item.nearest_km !== null && ` a ${formatDistance(item.nearest_km)}`}
          </p>
        </div>

        <div className="mt-4 w-full rounded-xl bg-primary/10 py-3 text-center text-sm font-bold text-primary-text transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-active:scale-[0.98]">
          Ver opciones
        </div>
      </div>
    </Link>
  );
}
