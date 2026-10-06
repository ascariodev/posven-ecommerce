import { ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import { cache } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatUsd, formatVes } from "@/lib/format";
import { listPurchases } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { AccountContext } from "@/lib/marketplace/params";
import type { Purchase, StoreOrder } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { formatDateTime, purchaseProgress, storeCountText } from "../lib/labels";
import { purchaseHref } from "./PurchaseList";

const RECENT_COUNT = 3;
const LAST_HEADING_ID = "ultima-compra-titulo";
const HEADING_ID = "compras-recientes-titulo";
const PICKUP_HEADING_ID = "para-retirar-titulo";

// Bloque secundario de /cuenta: con la API caída o un error de cuenta que no sea de sesión no se
// pinta, para que el resumen siga en pie (como la cabecera, L-02; diferencia declarada con §6). Un
// 401 sube: la sesión venció. Con `cache`, "Tu última compra" y "Compras recientes" comparten una
// sola lectura por petición mientras reciban el mismo `ctx` (L-12).
const recentOrNothing = cache(async (ctx: AccountContext): Promise<Purchase[]> => {
  try {
    return (await listPurchases(ctx, 1)).data;
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) return [];
    if (error instanceof MarketplaceAccountError && error.code !== "unauthenticated") return [];
    throw error;
  }
});

type PickupReady = { purchase: Purchase; order: StoreOrder; code: string };

function firstReadyForPickup(purchases: Purchase[]): PickupReady | null {
  for (const purchase of purchases) {
    for (const order of purchase.orders) {
      if (order.status === "ready_for_pickup" && order.pickup_code !== null) {
        return { purchase, order, code: order.pickup_code };
      }
    }
  }
  return null;
}

function storeNames(purchase: Purchase): string {
  return [...new Set(purchase.orders.map((order) => order.store.name))].join(", ");
}

function PickupCard({ ready }: { ready: PickupReady }) {
  return (
    <section aria-labelledby={PICKUP_HEADING_ID} className="rounded-2xl bg-primary-soft p-4 lg:p-6">
      <Link
        href={purchaseHref(ready.purchase.code)}
        className="flex flex-col gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <h2 id={PICKUP_HEADING_ID} className="text-sm font-bold uppercase tracking-wide text-foreground">
          Para retirar
        </h2>
        <span className="text-sm text-foreground">
          {ready.order.store.name} · {ready.purchase.code}
        </span>
        <span className="text-4xl font-extrabold tracking-widest text-foreground">{ready.code}</span>
      </Link>
    </section>
  );
}

function LastPurchaseCard({ purchase }: { purchase: Purchase }) {
  const progress = purchaseProgress(purchase);
  const readyStore = purchase.orders.find((order) => order.status === "ready_for_pickup")?.store.name;
  return (
    <section aria-labelledby={LAST_HEADING_ID}>
      <Card className="gap-3 px-4 md:flex-row md:items-center md:px-6">
        <span
          aria-hidden="true"
          className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-warning-soft text-warning md:flex"
        >
          <Package className="size-6" />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={LAST_HEADING_ID} className="font-heading text-base font-semibold text-foreground">
              Tu última compra
            </h2>
            <Badge variant={progress.variant}>{progress.text}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{purchase.code}</span> · {storeCountText(purchase.orders.length)} ·{" "}
            <span className="tabular-nums">{formatUsd(purchase.total_usd)}</span>
            {readyStore !== undefined && ` · ${readyStore} ya está lista para retirar`}
          </p>
        </div>
        <Link
          href={purchaseHref(purchase.code)}
          className={cn(buttonVariants({ variant: "outline" }), "w-full bg-card md:w-auto")}
        >
          Ver seguimiento
        </Link>
      </Card>
    </section>
  );
}

// "Tu última compra" (la primera de la página 1, que la API da más reciente primero) y, si algún
// pedido de esa página está listo con código, "Para retirar". Sin compras no se pinta nada.
export async function LastPurchase({ ctx }: { ctx: AccountContext }) {
  const data = await recentOrNothing(ctx);
  if (data.length === 0) return null;
  const ready = firstReadyForPickup(data);
  return (
    <>
      <LastPurchaseCard purchase={data[0]} />
      {ready && <PickupCard ready={ready} />}
    </>
  );
}

function PurchasesTable({ purchases }: { purchases: Purchase[] }) {
  return (
    <Card className="hidden gap-0 py-0 md:flex">
      <table className="w-full text-sm">
        <caption className="sr-only">Compras recientes</caption>
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="px-6 py-3 font-semibold">
              Código
            </th>
            <th scope="col" className="py-3 font-semibold">
              Fecha
            </th>
            <th scope="col" className="py-3 font-semibold">
              Tiendas
            </th>
            <th scope="col" className="py-3 text-right font-semibold">
              Total
            </th>
            <th scope="col" className="px-6 py-3 text-right font-semibold">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => {
            const progress = purchaseProgress(purchase);
            return (
              <tr key={purchase.code} className="border-b border-border last:border-0">
                <td className="px-6 py-3.5 font-semibold text-foreground">
                  <Link
                    href={purchaseHref(purchase.code)}
                    className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  >
                    {purchase.code}
                  </Link>
                </td>
                <td className="py-3.5 text-muted-foreground">{formatDateTime(purchase.created_at)}</td>
                <td className="py-3.5 text-foreground">{storeNames(purchase)}</td>
                <td className="py-3.5 text-right tabular-nums text-foreground">
                  {formatUsd(purchase.total_usd)}
                  <span className="block text-xs text-muted-foreground">{formatVes(purchase.total_ves)}</span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <Badge variant={progress.variant}>{progress.text}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function PurchasesRows({ purchases }: { purchases: Purchase[] }) {
  return (
    <Card size="sm" className="gap-0 py-0 md:hidden">
      <ul aria-label="Compras recientes" className="divide-y divide-border">
        {purchases.map((purchase) => {
          const progress = purchaseProgress(purchase);
          return (
            <li key={purchase.code}>
              <Link
                href={purchaseHref(purchase.code)}
                className="flex items-center gap-3 p-3.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {purchase.code} · <span className="tabular-nums">{formatUsd(purchase.total_usd)}</span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatDateTime(purchase.created_at)} · {storeNames(purchase)}
                  </span>
                </span>
                <Badge variant={progress.variant}>{progress.text}</Badge>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// "Compras recientes" de /cuenta: las 3 primeras de la página 1, en tabla desde `md` y en filas
// en móvil. Sin compras no se pinta nada.
export async function RecentPurchases({ ctx }: { ctx: AccountContext }) {
  const data = await recentOrNothing(ctx);
  if (data.length === 0) return null;
  const recent = data.slice(0, RECENT_COUNT);
  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={HEADING_ID} className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Compras recientes
        </h2>
        <Link href="/cuenta/compras" className="text-sm font-medium text-foreground underline underline-offset-4">
          Ver todas
        </Link>
      </div>
      <PurchasesTable purchases={recent} />
      <PurchasesRows purchases={recent} />
    </section>
  );
}
