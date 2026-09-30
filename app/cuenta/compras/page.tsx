import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/features/account/session";
import { cartEnabled } from "@/features/cart/flag";
import { PurchaseList } from "@/features/purchases/PurchaseList";
import { listPurchases } from "@/lib/marketplace/client";

export const metadata: Metadata = {
  title: "Mis compras",
  robots: { index: false, follow: false },
};

function readPage(raw: string | string[] | undefined): number {
  return typeof raw === "string" && /^[1-9]\d{0,5}$/.test(raw) ? Number(raw) : 1;
}

async function PurchasesPanel({ searchParams }: { searchParams: PageProps<"/cuenta/compras">["searchParams"] }) {
  const { ctx } = await requireCustomer("/cuenta/compras");
  const page = await listPurchases(ctx, readPage((await searchParams).pagina));
  // Una página fuera de rango con compras es 404; sin compras, la página 1 muestra el vacío.
  if (page.data.length === 0 && page.meta.page > 1) notFound();
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
