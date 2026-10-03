import Link from "next/link";
import { listPurchases } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { AccountContext } from "@/lib/marketplace/params";
import type { Purchase, StoreOrder } from "@/lib/marketplace/schemas";
import { PurchaseRow, purchaseHref } from "./PurchaseList";

const RECENT_COUNT = 3;
const HEADING_ID = "ultimas-compras-titulo";
const PICKUP_HEADING_ID = "para-retirar-titulo";

// Bloque secundario de /cuenta: con la API caída o un error de cuenta que no sea de sesión no se
// pinta, para que el resumen siga en pie (como la cabecera, L-02; diferencia declarada con §6). Un
// 401 sube: la sesión venció.
async function recentOrNothing(ctx: AccountContext): Promise<Purchase[]> {
  try {
    return (await listPurchases(ctx, 1)).data;
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) return [];
    if (error instanceof MarketplaceAccountError && error.code !== "unauthenticated") return [];
    throw error;
  }
}

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

function PickupCard({ ready }: { ready: PickupReady }) {
  return (
    <section aria-labelledby={PICKUP_HEADING_ID} className="rounded-lg bg-primary-soft p-4 lg:p-6">
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

// "Para retirar" y "Últimas compras" en /cuenta, de una sola lectura de la página 1 (la API da las
// más recientes primero): la tarjeta lleva el primer pedido listo con código y la lista, las tres
// primeras compras. Sin compras no se pinta nada.
export async function RecentPurchases({ ctx }: { ctx: AccountContext }) {
  const data = await recentOrNothing(ctx);
  if (data.length === 0) return null;
  const ready = firstReadyForPickup(data);
  return (
    <>
      {ready && <PickupCard ready={ready} />}
      <section aria-labelledby={HEADING_ID} className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id={HEADING_ID} className="text-xl font-bold tracking-tight text-foreground">
            Últimas compras
          </h2>
          <Link href="/cuenta/compras" className="text-sm font-medium text-foreground underline underline-offset-4">
            Ver todas
          </Link>
        </div>
        <ul aria-label="Últimas compras" className="flex flex-col gap-3">
          {data.slice(0, RECENT_COUNT).map((purchase) => (
            <PurchaseRow key={purchase.code} purchase={purchase} />
          ))}
        </ul>
      </section>
    </>
  );
}
