import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cx } from "@/components/ui/cx";
import { formatDistance } from "@/lib/format";
import type { NearbyStore } from "@/lib/marketplace/schemas";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function StoreCard({ store, featured }: { store: NearbyStore; featured?: boolean }) {
  const logoUrl = store.is_premium ? store.logo_url : null;
  return (
    <Link
      href={`/tienda/${store.slug}`}
      className={cx(
        "flex h-full items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        featured ? "bg-featured" : "bg-background",
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
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground"
        >
          {initials(store.name)}
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        {featured && (
          <Badge variant="featured" className="self-start">
            Destacado
          </Badge>
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
