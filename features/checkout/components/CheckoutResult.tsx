import { Check, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { emptyActionClass } from "@/components/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/features/account/server/session";
import { purchaseHref } from "@/features/purchases/components/PurchaseList";
import { OrderTracker } from "@/features/purchases/components/OrderTracker";
import { chargeText, FULFILLMENT_TEXT } from "@/features/purchases/lib/labels";
import { formatUsd, formatVes } from "@/lib/format";
import { getPurchase } from "@/lib/marketplace/client";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import type { Purchase, StoreOrder } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { PurchasePoller } from "./PurchasePoller";

export const PURCHASE_CODE_PATTERN = /^[A-Za-z0-9-]{1,40}$/;

export function resultHref(code: string): string {
  return `/checkout/resultado?compra=${encodeURIComponent(code)}`;
}

async function readPurchase(code: string): Promise<Purchase> {
  const { ctx } = await requireCustomer(resultHref(code));
  try {
    return await getPurchase(ctx, code);
  } catch (error) {
    if (error instanceof MarketplaceAccountError && error.code === "not_found") notFound();
    throw error;
  }
}

const headingClasses = "font-heading text-2xl font-semibold md:text-3xl";

function productsText(count: number): string {
  return count === 1 ? "1 producto" : `${count} productos`;
}

function Outcome({ tone, children }: { tone: "success" | "warning"; children: ReactNode }) {
  const Icon = tone === "success" ? Check : X;
  return (
    <Card className="items-center gap-3 px-6 text-center md:flex-row md:gap-6 md:px-8 md:text-left">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-20 shrink-0 items-center justify-center rounded-full",
          tone === "success" ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
        )}
      >
        <Icon className="size-10 stroke-[2.4]" />
      </span>
      <div className="flex flex-col gap-1.5">{children}</div>
    </Card>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2.5 md:flex-row">{children}</div>;
}

function BackToCart() {
  return (
    <Actions>
      <Link href="/carrito" className={buttonVariants({ size: "lg" })}>
        Volver al carrito
      </Link>
    </Actions>
  );
}

function StoreBlock({ order }: { order: StoreOrder }) {
  return (
    <Card className="gap-5 px-5 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="font-semibold md:text-[17px]">
          {order.store.name} · {FULFILLMENT_TEXT[order.fulfillment].toLowerCase()}
        </h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {productsText(order.lines.length)} · {formatUsd(order.subtotal_usd)}
        </span>
      </div>
      <OrderTracker order={order} />
      {order.pickup_code !== null && (
        <div className="flex flex-col gap-1 rounded-2xl bg-primary-soft p-4">
          <p className="text-sm text-foreground">Código de retiro</p>
          <p className="text-3xl font-extrabold tracking-widest text-foreground">{order.pickup_code}</p>
        </div>
      )}
    </Card>
  );
}

export async function CheckoutResult({ code }: { code: string }) {
  const purchase = await readPurchase(code);

  switch (purchase.status) {
    case "pending_payment":
      return (
        <div className="flex flex-col gap-4">
          <h1 className={headingClasses}>Estamos confirmando tu pago</h1>
          <PurchasePoller href={resultHref(purchase.code)} />
        </div>
      );
    case "paid":
      return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 md:gap-6">
          <Outcome tone="success">
            <h1 className={headingClasses}>¡Pago confirmado!</h1>
            <p className="text-muted-foreground tabular-nums">
              Código <strong className="text-foreground">{purchase.code}</strong> ·{" "}
              <span className="whitespace-nowrap">pagaste {chargeText(purchase.charge)}</span>
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              Total {formatUsd(purchase.total_usd)} · {formatVes(purchase.total_ves)}
            </p>
          </Outcome>
          {purchase.orders.map((order) => (
            <StoreBlock key={order.store.slug} order={order} />
          ))}
          <Actions>
            <Link href={purchaseHref(purchase.code)} prefetch={false} className={buttonVariants({ size: "lg" })}>
              Ver detalle del pedido
            </Link>
            <Link
              href="/cuenta/compras"
              prefetch={false}
              className={emptyActionClass}
            >
              Ver mis compras
            </Link>
            <Link href="/" className={emptyActionClass}>
              Seguir comprando
            </Link>
          </Actions>
        </div>
      );
    case "failed":
      return (
        <div className="flex flex-col gap-5 md:gap-6">
          <Outcome tone="warning">
            <h1 className={headingClasses}>El pago no se completó</h1>
            <p className="text-foreground">Tu carrito sigue igual.</p>
          </Outcome>
          <BackToCart />
        </div>
      );
    case "expired":
      return (
        <div className="flex flex-col gap-5 md:gap-6">
          <Outcome tone="warning">
            <h1 className={headingClasses}>La compra venció sin pago</h1>
            <p className="text-foreground">Tu carrito sigue igual.</p>
          </Outcome>
          <BackToCart />
        </div>
      );
  }
}

export function CheckoutResultSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
