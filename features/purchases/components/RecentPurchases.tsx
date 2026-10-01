import Link from "next/link";
import { listPurchases } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { AccountContext } from "@/lib/marketplace/params";
import type { Purchase } from "@/lib/marketplace/schemas";
import { PurchaseRow } from "./PurchaseList";

const RECENT_COUNT = 3;
const HEADING_ID = "ultimas-compras-titulo";

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

// "Últimas compras" en /cuenta: las tres primeras de la página 1 (la API las da más recientes
// primero). Sin compras no se pinta.
export async function RecentPurchases({ ctx }: { ctx: AccountContext }) {
  const data = await recentOrNothing(ctx);
  if (data.length === 0) return null;
  return (
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
  );
}
