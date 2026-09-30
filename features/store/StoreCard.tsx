import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/format";
import type { NearbyStore } from "@/lib/marketplace/schemas";
import { storeInitials } from "./initials";

export function StoreCard({ store, featured }: { store: NearbyStore; featured?: boolean }) {
  const logoUrl = store.is_premium ? store.logo_url : null;
  return (
    <Link
      href={`/tienda/${store.slug}`}
      className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <Card className="h-full gap-0 py-0 transition-shadow duration-200 ease-out hover:shadow-raised motion-reduce:transition-none">
        <div aria-hidden="true" className={cn("h-16", featured ? "bg-featured" : "bg-primary-soft")} />
        <div className="-mt-7 flex flex-col gap-2 px-4 pb-4">
          {logoUrl !== null ? (
            <Image
              src={logoUrl}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-full border-4 border-card bg-card object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full border-4 border-card bg-primary-soft text-lg font-bold text-warning"
            >
              {storeInitials(store.name)}
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            {(featured || store.outside_radius) && (
              <div className="flex flex-wrap gap-1">
                {featured && <Badge variant="default">Destacado</Badge>}
                {store.outside_radius && <Badge variant="secondary">Fuera de tu zona</Badge>}
              </div>
            )}
            <h3 className="font-semibold text-foreground">{store.name}</h3>
            <p className="text-sm text-muted-foreground">
              {store.city.name}
              {store.distance_km !== null && ` · ${formatDistance(store.distance_km)}`}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
