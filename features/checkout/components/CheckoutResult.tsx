import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/features/account/server/session";
import { formatUsd, formatVes } from "@/lib/format";
import { getPurchase } from "@/lib/marketplace/client";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import type { Purchase } from "@/lib/marketplace/schemas";
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

const headingClasses = "text-2xl font-extrabold tracking-tight sm:text-3xl";

function BackToCart() {
  return (
    <Link href="/carrito" className={buttonVariants({ variant: "outline" })}>
      Volver al carrito
    </Link>
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
        <div className="flex flex-col gap-4">
          <h1 className={headingClasses}>¡Pago confirmado!</h1>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <p className="text-foreground">
                Compra <span className="font-semibold">{purchase.code}</span>
              </p>
              <p className="text-foreground">
                Total {formatUsd(purchase.total_usd)} · {formatVes(purchase.total_ves)}
              </p>
            </CardContent>
          </Card>
          <Link
            href={`/cuenta/compras/${encodeURIComponent(purchase.code)}`}
            prefetch={false}
            className={cn(buttonVariants(), "self-start")}
          >
            Ver tu compra
          </Link>
        </div>
      );
    case "failed":
      return (
        <div className="flex flex-col items-start gap-4">
          <h1 className={headingClasses}>El pago no se completó</h1>
          <p className="text-foreground">Tu carrito sigue igual.</p>
          <BackToCart />
        </div>
      );
    case "expired":
      return (
        <div className="flex flex-col items-start gap-4">
          <h1 className={headingClasses}>La compra venció sin pago</h1>
          <p className="text-foreground">Tu carrito sigue igual.</p>
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
