import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatUsd, formatVes } from "@/lib/format";
import type { CartStore } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { CartLine } from "./CartLine";
import { FulfillmentSwitch } from "./FulfillmentSwitch";

function Row({ label, value, strong, ok }: { label: string; value: string; strong?: boolean; ok?: boolean }) {
  return (
    <p className={cn("flex justify-between gap-3 text-sm", strong && "font-semibold")}>
      <span className={cn(strong ? "text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className={cn("tabular-nums text-foreground", ok && "font-semibold text-success")}>{value}</span>
    </p>
  );
}

export function CartStoreGroup({ entry, delivery }: { entry: CartStore; delivery: string[] }) {
  const { store } = entry;
  const feeUsd = entry.delivery_fee_usd;
  const feeVes = entry.delivery_fee_ves;
  const delivering = entry.fulfillment === "delivery" && feeUsd != null && feeVes != null;
  const totalUsd = entry.total_usd ?? entry.subtotal_usd;
  const totalVes = entry.total_ves ?? entry.subtotal_ves;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 className="text-lg font-bold tracking-tight">
              <Link
                href={`/tienda/${store.slug}`}
                className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {store.name}
              </Link>
            </h2>
            <span className="text-sm text-muted-foreground">{store.city.name}</span>
          </div>
          {!entry.is_open && <Badge variant="secondary">Cerrada ahora</Badge>}
          <FulfillmentSwitch entry={entry} delivery={delivery} />
        </div>
        <ul aria-label={`Productos de ${store.name}`} className="flex flex-col">
          {entry.lines.map((line) => (
            <CartLine key={line.product.slug} line={line} storeSlug={store.slug} />
          ))}
        </ul>
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <Row label="Productos" value={`${formatUsd(entry.subtotal_usd)} · ${formatVes(entry.subtotal_ves)}`} />
          {delivering ? (
            <Row label="Entrega a domicilio" value={`${formatUsd(feeUsd)} · ${formatVes(feeVes)}`} />
          ) : (
            <Row label="Retiro en tienda" value="Sin costo" ok />
          )}
          <Row label="Total de esta tienda" value={`${formatUsd(totalUsd)} · ${formatVes(totalVes)}`} strong />
        </div>
      </CardContent>
    </Card>
  );
}
