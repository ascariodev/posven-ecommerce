import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatUsd, formatVes } from "@/lib/format";
import type { Purchase, PurchasePage } from "@/lib/marketplace/schemas";
import { formatDateTime, purchaseStatusText, storeCountText } from "./labels";

// Los montos son las cadenas de la API formateadas: aquí no se suma nada.

export function purchaseHref(code: string): string {
  return `/cuenta/compras/${encodeURIComponent(code)}`;
}

function pageHref(page: number): string {
  return page === 1 ? "/cuenta/compras" : `/cuenta/compras?pagina=${page}`;
}

export function PurchaseRow({ purchase }: { purchase: Purchase }) {
  return (
    <li>
      <Link
        href={purchaseHref(purchase.code)}
        className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-bold tracking-tight text-foreground">{purchase.code}</span>
            <Badge variant={purchase.status === "paid" ? "secondary" : "warning"}>{purchaseStatusText(purchase)}</Badge>
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDateTime(purchase.created_at)} · {storeCountText(purchase.orders.length)}
          </span>
        </span>
        <span className="text-foreground sm:text-right">
          {formatUsd(purchase.total_usd)} · {formatVes(purchase.total_ves)}
        </span>
      </Link>
    </li>
  );
}

export function PurchaseList({ page }: { page: PurchasePage }) {
  const { data, meta } = page;
  if (data.length === 0 && meta.page === 1) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-muted-foreground">Todavía no tienes compras.</p>
        <Link href="/buscar" className={buttonVariants({ variant: "outline" })}>
          Buscar productos
        </Link>
      </div>
    );
  }
  const hasPrevious = meta.page > 1;
  const hasNext = meta.page * meta.per_page < meta.total;
  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="Compras" className="flex flex-col gap-3">
        {data.map((purchase) => (
          <PurchaseRow key={purchase.code} purchase={purchase} />
        ))}
      </ul>
      {(hasPrevious || hasNext) && (
        <nav aria-label="Páginas de compras" className="flex justify-between gap-2">
          {hasPrevious ? (
            <Link href={pageHref(meta.page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Anteriores
            </Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link href={pageHref(meta.page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Siguientes
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
