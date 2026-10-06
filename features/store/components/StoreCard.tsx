import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDistance } from "@/lib/format";
import type { NearbyStore } from "@/lib/marketplace/schemas";
import { PremiumSeal } from "./PremiumSeal";
import { StoreLogo } from "./StoreLogo";

export function StoreOpenBadge({ store }: { store: NearbyStore }) {
  if (store.is_open === undefined) return null;
  if (!store.is_open) return <Badge variant="secondary">Cerrado</Badge>;
  return (
    <Badge variant="success">
      {store.closes_at ? `Abierto · hasta ${store.closes_at}` : "Abierto"}
    </Badge>
  );
}

export function StoreCard({ store, featured }: { store: NearbyStore; featured?: boolean }) {
  const coverUrl = store.cover_url ?? null;
  return (
    <Link
      href={`/tienda/${store.slug}`}
      className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <Card className="h-full min-h-11 gap-0 py-0 transition-shadow duration-200 ease-out hover:shadow-raised motion-reduce:transition-none">
        <div className="relative h-20 bg-muted">
          {coverUrl !== null && (
            <Image src={coverUrl} alt="" width={600} height={150} className="size-full object-cover" />
          )}
          <div className="absolute inset-x-0 top-0 flex flex-wrap gap-1 p-2 [&_[data-variant=secondary]]:bg-card">
            <StoreOpenBadge store={store} />
            {featured && <Badge variant="default" className="bg-primary-soft text-primary-text">Destacado</Badge>}
            {store.outside_radius && <Badge variant="secondary">Fuera de tu zona</Badge>}
            {store.is_premium && <PremiumSeal />}
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 p-3">
          <StoreLogo store={store} className="size-12 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="truncate font-semibold text-foreground">{store.name}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {store.city.name}
              {store.distance_km !== null && ` · ${formatDistance(store.distance_km)}`}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
