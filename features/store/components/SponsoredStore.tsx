import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatDistance } from "@/lib/format";
import type { NearbyStore } from "@/lib/marketplace/schemas";
import { StoreOpenBadge } from "./StoreCard";
import { PremiumSeal } from "./PremiumSeal";
import { StoreLogo } from "./StoreLogo";

export function SponsoredStore({ store }: { store: NearbyStore }) {
  return (
    <Link
      href={`/tienda/${store.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card transition-shadow duration-200 ease-out hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
    >
      <StoreLogo store={store} className="size-14 shrink-0 rounded-2xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground">PATROCINADO</span>
        <span className="truncate font-semibold text-foreground">{store.name}</span>
        {store.is_premium && <PremiumSeal className="my-0.5" />}
        <span className="truncate text-sm text-muted-foreground">
          {store.city.name}
          {store.distance_km !== null && ` · ${formatDistance(store.distance_km)}`}
        </span>
        <span className="mt-1 flex">
          <StoreOpenBadge store={store} />
        </span>
      </div>
      <span className={buttonVariants({ size: "sm" })}>Ver tienda</span>
    </Link>
  );
}
