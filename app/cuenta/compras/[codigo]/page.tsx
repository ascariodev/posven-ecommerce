import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/features/account/session";
import { cartEnabled } from "@/features/cart/flag";
import { PURCHASE_CODE_PATTERN } from "@/features/checkout/CheckoutResult";
import { PurchaseDetail } from "@/features/purchases/PurchaseDetail";
import { purchaseHref } from "@/features/purchases/PurchaseList";
import { getPurchase } from "@/lib/marketplace/client";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import type { Purchase } from "@/lib/marketplace/schemas";

// Título fijo: el código viene de la petición y los metadatos se resuelven fuera del <Suspense>.
export const metadata: Metadata = {
  title: "Detalle de compra",
  robots: { index: false, follow: false },
};

async function readPurchase(code: string): Promise<Purchase> {
  const { ctx } = await requireCustomer(purchaseHref(code));
  try {
    return await getPurchase(ctx, code);
  } catch (error) {
    if (error instanceof MarketplaceAccountError && error.code === "not_found") notFound();
    throw error;
  }
}

async function PurchasePanel({ params }: { params: PageProps<"/cuenta/compras/[codigo]">["params"] }) {
  const { codigo } = await params;
  if (!PURCHASE_CODE_PATTERN.test(codigo)) notFound();
  const purchase = await readPurchase(codigo);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Compra {purchase.code}</h1>
      <PurchaseDetail purchase={purchase} />
    </div>
  );
}

export default function PurchasePage({ params }: PageProps<"/cuenta/compras/[codigo]">) {
  if (!cartEnabled()) notFound();
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Link href="/cuenta/compras" className="text-sm font-medium text-foreground underline underline-offset-4">
        Volver a mis compras
      </Link>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <PurchasePanel params={params} />
      </Suspense>
    </div>
  );
}
