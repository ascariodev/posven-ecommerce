import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDistance } from "@/lib/format";
import type { NearbyStore } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { storeInitials } from "../lib/initials";

export function StoreLogo({ store, className }: { store: NearbyStore; className: string }) {
  if (store.is_premium && store.logo_url !== null) {
    return (
      <Image
        src={store.logo_url}
        alt=""
        width={56}
        height={56}
        className={cn(className, "object-cover")}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(className, "flex items-center justify-center bg-primary-soft font-heading font-semibold text-primary-text")}
    >
      {storeInitials(store.name)}
    </div>
  );
}

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
  return (
    <Link
      href={`/tienda/${store.slug}`}
      className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <Card className="h-full min-h-11 flex-row items-center gap-3 p-3 transition-shadow duration-200 ease-out hover:shadow-raised motion-reduce:transition-none">
        <StoreLogo store={store} className="size-12 shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {(featured || store.outside_radius) && (
            <div className="flex flex-wrap gap-1">
              {featured && <Badge variant="default" className="bg-primary-soft text-primary-text">Destacado</Badge>}
              {store.outside_radius && <Badge variant="secondary">Fuera de tu zona</Badge>}
            </div>
          )}
          <h3 className="truncate font-semibold text-foreground">{store.name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {store.city.name}
            {store.distance_km !== null && ` · ${formatDistance(store.distance_km)}`}
          </p>
        </div>
        <StoreOpenBadge store={store} />
      </Card>
    </Link>
  );
}
