import { Store, Truck } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import type { CartStore } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { cartPathWith } from "../lib/fulfillment";

// Enlaces que cambian `f-<tienda>` en la URL: funcionan sin JavaScript y la API recotiza.
export function FulfillmentSwitch({ entry, delivery }: { entry: CartStore; delivery: string[] }) {
  const slug = entry.store.slug;
  const fee = entry.delivery_fee_usd;
  if (!entry.offers_delivery || fee === null || fee === undefined) {
    return (
      <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
        Retiro sin costo
      </span>
    );
  }
  const delivering = entry.fulfillment === "delivery";
  return (
    <nav aria-label={`Cómo recibir lo de ${entry.store.name}`} className="grid w-full grid-cols-2 gap-2 md:w-auto">
      <Link
        href={cartPathWith(delivery, slug, false)}
        aria-current={delivering ? undefined : "true"}
        className={cn(buttonVariants({ variant: delivering ? "outline" : "default", size: "sm" }), "px-4")}
      >
        <Store aria-hidden="true" />
        Retiro
      </Link>
      <Link
        href={cartPathWith(delivery, slug, true)}
        aria-current={delivering ? "true" : undefined}
        className={cn(buttonVariants({ variant: delivering ? "default" : "outline", size: "sm" }), "px-4")}
      >
        <Truck aria-hidden="true" />
        Entrega · {formatUsd(fee)}
      </Link>
    </nav>
  );
}
