import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/format";
import type { NearbyStore } from "@/lib/marketplace/schemas";
import { storeInitials } from "./initials";

export function StoreCard({ store, featured }: { store: NearbyStore; featured?: boolean }) {
  const logoUrl = store.is_premium ? store.logo_url : null;
  return (
    <Link
      href={`/tienda/${store.slug}`}
      className={cn(
        "flex h-full items-center gap-4 rounded-lg border border-border p-4 shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-raised motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        featured ? "bg-featured" : "bg-surface",
      )}
    >
      {logoUrl !== null ? (
        <Image
          src={logoUrl}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-warning"
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
        <h3 className="font-medium text-foreground">{store.name}</h3>
        <p className="text-sm text-muted-foreground">
          {store.city.name}
          {store.distance_km !== null && ` · ${formatDistance(store.distance_km)}`}
        </p>
      </div>
    </Link>
  );
}
