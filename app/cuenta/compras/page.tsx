import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/features/account/session";
import { cartEnabled } from "@/features/cart/flag";
import { isPageOutOfRange, readPurchasesPage } from "@/features/purchases/pagination";
import { PurchaseList } from "@/features/purchases/PurchaseList";
import { listPurchases } from "@/lib/marketplace/client";

export const metadata: Metadata = {
  title: "Mis compras",
  robots: { index: false, follow: false },
};

async function PurchasesPanel({ searchParams }: { searchParams: PageProps<"/cuenta/compras">["searchParams"] }) {
  const { ctx } = await requireCustomer("/cuenta/compras");
  const page = await listPurchases(ctx, readPurchasesPage((await searchParams).pagina));
  if (isPageOutOfRange(page)) notFound();
  return <PurchaseList page={page} />;
}

export default function PurchasesPage({ searchParams }: PageProps<"/cuenta/compras">) {
  if (!cartEnabled()) notFound();
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Mis compras</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <PurchasesPanel searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
