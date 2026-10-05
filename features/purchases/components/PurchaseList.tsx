import { Receipt } from "lucide-react";
import Link from "next/link";
import { EmptyState, emptyActionClass } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatUsd, formatVes } from "@/lib/format";
import type { Purchase, PurchasePage } from "@/lib/marketplace/schemas";
import { formatDateTime, purchaseStatusText, storeCountText } from "../lib/labels";

// Los montos son las cadenas de la API formateadas: aquí no se suma nada.

export function purchaseHref(code: string): string {
  return `/cuenta/compras/${encodeURIComponent(code)}`;
}

function pageHref(page: number): string {
  return page === 1 ? "/cuenta/compras" : `/cuenta/compras?pagina=${page}`;
}

export function PurchaseRows({ purchases, label }: { purchases: Purchase[]; label: string }) {
  return (
    <ul aria-label={label} className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-card">
      {purchases.map((purchase) => (
        <PurchaseRow key={purchase.code} purchase={purchase} />
      ))}
    </ul>
  );
}

export function PurchaseRow({ purchase }: { purchase: Purchase }) {
  return (
    <li>
      <Link
        href={purchaseHref(purchase.code)}
        className="flex flex-col gap-1 p-4 transition-colors duration-200 hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between"
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
        <span className="flex flex-col sm:items-end">
          <span className="font-bold text-foreground">{formatUsd(purchase.total_usd)}</span>
          <span className="text-sm text-muted-foreground">{formatVes(purchase.total_ves)}</span>
        </span>
      </Link>
    </li>
  );
}

export function PurchaseList({ page }: { page: PurchasePage }) {
  const { data, meta } = page;
  if (data.length === 0 && meta.page === 1) {
    return (
      <EmptyState icon={Receipt} title="Todavía no tienes compras.">
        <Link href="/buscar" className={emptyActionClass}>
          Buscar productos
        </Link>
      </EmptyState>
    );
  }
  const hasPrevious = meta.page > 1;
  const hasNext = meta.page * meta.per_page < meta.total;
  return (
    <div className="flex flex-col gap-4">
      <PurchaseRows purchases={data} label="Compras" />
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
